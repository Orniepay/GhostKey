# Requirements Document

## Introduction

Switch input turns raw switch events (press starts, press ends, and time passing) into Morse patterns made of `.` and `-`. It supports 1-switch, 2-switch, and 3-switch modes, a hold-progress value for the on-screen halo, calibration, and slow adaptive timing. The finished pattern of each letter is passed to the existing `decodePattern` function in `src/core/morse/`.

All logic lives in `src/core/morse/` as pure TypeScript. It contains no React, no browser code, and no clock or timers. The caller passes every timestamp in milliseconds. State goes in and new state out, in the same style as `message-editor.ts`. Nothing is changed in place.

Every mode uses the same press model. A switch has a press start event and a press end event. A press counts only when it ends and its duration is at least the Minimum_Press. In 1-switch mode the duration also decides dot or dash. In 2-switch and 3-switch modes each switch adds its own symbol, once per counted press, when the press ends. A physical keyboard key that is held down repeats its key-down event, so a press start for a switch that is already held is ignored. Holding a key therefore adds one symbol, not many.

This spec follows `.kiro/steering/morse-rules.md`, `accessibility.md`, and `testing-standards.md`. Accessibility rules 2 and 3 apply directly: timing limits are adjustable and adapt to the user, and nothing is lost or auto-sent because the user was slow.

Confirmed decisions:
- A press whose duration equals the Dash_Limit is a dash, and the hold progress is exactly 1 at that moment. The comparison is "at least" (greater than or equal to), not "longer than".
- A letter ends when the time since the last counted release is greater than or equal to the Letter_Gap. The comparison is "at least", not "longer than".
- In 2-switch and 3-switch modes a symbol is added when the press ends, never when it starts, and only when the press lasted at least the Minimum_Press.
- A press shorter than the Minimum_Press changes nothing. It does not change the Pending_Pattern and does not restart the letter gap.
- In 1-switch and 2-switch modes, while any switch is held, no letter ends because of time passing.

Assumptions:
- Because the core has no timers, the caller sends a "time passed" event with the current timestamp to let a letter end by pause.
- The caller sends a press start event for each key-down event, including repeated key-down events from a held key, and a press end event for each key-up event.

## Glossary

- **Switch_Input**: The pure TypeScript module in `src/core/morse/` that implements the requirements in this document.
- **Switch_Id**: The name of one switch. The names are `main` (the only switch in 1-switch mode), `dot` and `dash` (2-switch and 3-switch modes), and `next` (3-switch mode only).
- **Input_State**: The immutable value that holds the current mode, the Timing_Settings, the Pending_Pattern, the Held_Switches, the Last_Counted_Release, the Recent_Presses, and the Calibrated_Flag.
- **Input_Event**: One of four events passed to a transition: a press start (with a Switch_Id and a timestamp), a press end (with a Switch_Id and a timestamp), a time-passed event (with a timestamp), or a mode change (with the new mode).
- **Input_Output**: The value returned by every Switch_Input transition. It holds the new Input_State and the Finished_Pattern, which is `null` when no letter ended.
- **Timing_Settings**: The three adjustable values: Dash_Limit, Letter_Gap, and Minimum_Press.
- **Dash_Limit**: The press length in milliseconds at which a press becomes a dash in 1-switch mode. Default 400. Range 150 to 3000.
- **Letter_Gap**: The pause in milliseconds after the Last_Counted_Release that ends a letter in 1-switch and 2-switch modes. Default 1500. Range 500 to 10000.
- **Minimum_Press**: The shortest press length in milliseconds that counts as a press, in every mode. Default 30. Range 0 to 200.
- **Pending_Pattern**: The string of `.` and `-` characters entered so far for the letter that has not ended.
- **Finished_Pattern**: The Pending_Pattern at the moment a letter ends, given to `decodePattern`.
- **Held_Switches**: The switches that are currently held down, each stored with its own Press_Start. A switch appears at most once.
- **Press_Start**: The timestamp in milliseconds when one switch went down. Each held switch has its own Press_Start.
- **Counted_Press**: A press whose raw duration is greater than or equal to the Minimum_Press. The raw duration is the press end time minus that switch's Press_Start, with no adjustment or clamping, and it is negative when the press end time is earlier than the Press_Start. A press with a shorter raw duration is an Ignored_Press.
- **Ignored_Press**: A press whose raw duration is less than the Minimum_Press. A press end earlier than the Press_Start has a negative raw duration and is always an Ignored_Press, including when the Minimum_Press is 0. It changes neither the Pending_Pattern nor the Last_Counted_Release.
- **Last_Counted_Release**: The timestamp in milliseconds when the most recent Counted_Press ended, or no value when no Counted_Press has ended since the last letter ended or mode change.
- **Key_Repeat**: A press start event for a switch that is already in the Held_Switches.
- **Hold_Progress**: A number from 0 to 1 that shows how far a held press is toward the Dash_Limit.
- **Tap**: A Counted_Press classified as a dot in 1-switch mode.
- **Hold**: A Counted_Press classified as a dash in 1-switch mode.
- **Recent_Presses**: The durations of the last 10 Taps and the last 10 Holds that were classified.
- **Calibration_Samples**: The measured Tap durations, Hold durations, and pauses between presses, all in milliseconds, supplied by the caller.
- **Median**: The middle value of a sorted list. For an even count, the mean of the two middle values.
- **Calibrated_Flag**: A boolean in Input_State that is true after one successful calibration.
- **Purity_Test**: The existing test file `src/core/morse/morse-purity.test.ts`, which scans source files in `src/core/morse/` for forbidden references.

## Requirements

### Requirement 1: Timing settings and clamping

**User Story:** As a user or caregiver, I want timing limits with safe defaults and ranges, so that the timing fits the user and bad values never break input.

#### Acceptance Criteria

1. THE Switch_Input SHALL provide default Timing_Settings with a Dash_Limit of 400 ms, a Letter_Gap of 1500 ms, and a Minimum_Press of 30 ms.
2. WHEN a finite numeric Timing_Settings value is supplied, THE Switch_Input SHALL clamp the Dash_Limit into the range 150 to 3000 ms inclusive, the Letter_Gap into the range 500 to 10000 ms inclusive, and the Minimum_Press into the range 0 to 200 ms inclusive. A value below the range minimum SHALL become the minimum, and a value above the range maximum SHALL become the maximum.
3. IF a supplied Timing_Settings value is NaN, Infinity, -Infinity, or not a number type, THEN THE Switch_Input SHALL use the default for that value (400 ms, 1500 ms, or 30 ms) and SHALL NOT throw an error.
4. WHEN a Timing_Settings value is already inside its range (inclusive of both bounds), THE Switch_Input SHALL return that value unchanged.
5. FOR ALL numeric inputs, clamping a Timing_Settings value twice SHALL produce the same result as clamping once (idempotence).
6. WHEN a Timing_Settings object is supplied with some values missing, THE Switch_Input SHALL use the default for each missing value and SHALL clamp the values that are present, so that the returned Timing_Settings always has all three values.

### Requirement 2: 1-switch mode

**User Story:** As a user with one reliable movement, I want one button where a short press is a dot and a long press is a dash, so that I can write with a single switch.

#### Acceptance Criteria

1. WHEN a press start for the `main` switch is received in 1-switch mode and the `main` switch is not held, THE Switch_Input SHALL add the `main` switch with its Press_Start to the Held_Switches and leave the Pending_Pattern unchanged.
2. WHEN a press end for the `main` switch is received and its raw duration (press end time minus Press_Start) is less than the Minimum_Press (in milliseconds), THE Switch_Input SHALL remove the `main` switch from the Held_Switches, leave the Pending_Pattern and the Last_Counted_Release unchanged, and return no Finished_Pattern.
3. WHEN a press end for the `main` switch is received and its raw duration is greater than or equal to the Minimum_Press and less than the Dash_Limit (in milliseconds), THE Switch_Input SHALL append exactly one `.` to the end of the Pending_Pattern, set the Last_Counted_Release to the press end time, and remove the `main` switch from the Held_Switches.
4. WHEN a press end for the `main` switch is received and its raw duration is greater than or equal to the Dash_Limit (in milliseconds), THE Switch_Input SHALL append exactly one `-` to the end of the Pending_Pattern, set the Last_Counted_Release to the press end time, and remove the `main` switch from the Held_Switches. A duration exactly equal to the Dash_Limit is a dash.
5. WHILE the Pending_Pattern is not empty and the Held_Switches are empty, WHEN a time-passed event is received and the elapsed time since the Last_Counted_Release is greater than or equal to the Letter_Gap (in milliseconds), THE Switch_Input SHALL return the Pending_Pattern as the Finished_Pattern, set the Pending_Pattern to empty, and clear the Last_Counted_Release.
6. WHEN a press start is received and the elapsed time since the Last_Counted_Release is less than the Letter_Gap, THE Switch_Input SHALL keep the Pending_Pattern unchanged, return no Finished_Pattern, and continue the same letter.
7. WHILE a switch is held, THE Switch_Input SHALL keep the Pending_Pattern unchanged and return no Finished_Pattern for every time-passed event, whatever the elapsed time.
8. WHEN the Pending_Pattern is empty and a time-passed event is received, THE Switch_Input SHALL return no Finished_Pattern and leave the Input_State unchanged.
9. IF a press end is received for a switch that is not held, or a press start is received for a switch that is already held (Key_Repeat), THEN THE Switch_Input SHALL return the Input_State unchanged with no Finished_Pattern.
10. IF a press end is received with a timestamp earlier than the Press_Start of that switch, THEN THE Switch_Input SHALL treat the press as an Ignored_Press under criterion 2, because the raw duration is negative and therefore less than every Minimum_Press, including a Minimum_Press of 0 ms.
11. WHEN a press start is received, the Pending_Pattern is not empty, and the elapsed time since the Last_Counted_Release is greater than or equal to the Letter_Gap, THE Switch_Input SHALL return the Pending_Pattern as the Finished_Pattern, set the Pending_Pattern to empty, clear the Last_Counted_Release, and add the switch to the Held_Switches, so that a late press never joins the previous letter.
12. IF a time-passed event or a press start is received with a timestamp earlier than the Last_Counted_Release, THEN THE Switch_Input SHALL treat the elapsed time since the Last_Counted_Release as 0 ms.

### Requirement 3: Hold progress

**User Story:** As a user, I want to see how close my held press is to becoming a dash, so that I know exactly when to let go.

#### Acceptance Criteria

1. WHEN a Press_Start, a current time, and a Dash_Limit are supplied as timestamps and a duration in milliseconds, with the current time at or after the Press_Start and the Dash_Limit a finite number greater than 0, THE Switch_Input SHALL return a Hold_Progress equal to the elapsed time (current time minus Press_Start) divided by the Dash_Limit, limited to the range 0 to 1 inclusive.
2. WHEN the elapsed time equals the Dash_Limit, THE Switch_Input SHALL return a Hold_Progress of exactly 1.
3. WHEN the elapsed time is greater than the Dash_Limit, THE Switch_Input SHALL return a Hold_Progress of exactly 1.
4. WHEN the elapsed time is less than the Dash_Limit, THE Switch_Input SHALL return an is-dash value of false.
5. WHEN the elapsed time is at least the Dash_Limit, THE Switch_Input SHALL return an is-dash value of true.
6. IF the current time is earlier than the Press_Start, THEN THE Switch_Input SHALL return a Hold_Progress of 0 and an is-dash value of false.
7. IF the Dash_Limit is 0, negative, or not a finite number, THEN THE Switch_Input SHALL return a Hold_Progress of 0 and an is-dash value of false, and SHALL NOT throw an error.
8. FOR ALL valid inputs with the same Press_Start and Dash_Limit, THE Switch_Input SHALL return a Hold_Progress for a later current time that is greater than or equal to the Hold_Progress for an earlier current time (monotonic).
9. FOR ALL valid inputs where the elapsed time is at least the Minimum_Press, THE Switch_Input SHALL return an is-dash value from hold progress equal to the dash or dot classification it makes when a press ends at that same elapsed time.

### Requirement 4: 2-switch mode

**User Story:** As a user with two reliable movements, I want one switch for dots and one for dashes, so that press length does not matter and holding a key adds only one symbol.

#### Acceptance Criteria

1. WHEN a press start for the `dot` switch or the `dash` switch is received in 2-switch mode and that switch is not held, THE Switch_Input SHALL add that switch with its Press_Start to the Held_Switches and leave the Pending_Pattern unchanged.
2. WHEN a press end for the `dot` switch is received in 2-switch mode and its raw duration (press end time minus Press_Start) is greater than or equal to the Minimum_Press, THE Switch_Input SHALL append exactly one `.` to the Pending_Pattern, set the Last_Counted_Release to the press end time, and remove the `dot` switch from the Held_Switches, whatever the press length, including a length longer than the Dash_Limit.
3. WHEN a press end for the `dash` switch is received in 2-switch mode and its raw duration is greater than or equal to the Minimum_Press, THE Switch_Input SHALL append exactly one `-` to the Pending_Pattern, set the Last_Counted_Release to the press end time, and remove the `dash` switch from the Held_Switches, whatever the press length, including a length shorter than the Dash_Limit.
4. WHEN a press end is received in 2-switch mode and its raw duration is less than the Minimum_Press, THE Switch_Input SHALL remove that switch from the Held_Switches, leave the Pending_Pattern and the Last_Counted_Release unchanged, and return no Finished_Pattern, so that an Ignored_Press does not restart the letter gap.
5. IF a press end is received in 2-switch mode for a switch that is not held, or a press start is received for a switch that is already held (Key_Repeat), THEN THE Switch_Input SHALL return the Input_State unchanged with no Finished_Pattern.
6. IF a press end is received in 2-switch mode with a timestamp earlier than the Press_Start of that switch, THEN THE Switch_Input SHALL treat the press as an Ignored_Press under criterion 4, because the raw duration is negative and therefore less than every Minimum_Press, including a Minimum_Press of 0 ms.
7. WHILE the Pending_Pattern is not empty and the Held_Switches are empty in 2-switch mode, WHEN a time-passed event is received and the elapsed time since the Last_Counted_Release is greater than or equal to the Letter_Gap, THE Switch_Input SHALL return the Pending_Pattern as the Finished_Pattern, set the Pending_Pattern to empty, and clear the Last_Counted_Release.
8. WHILE the Pending_Pattern is not empty and the Held_Switches are empty in 2-switch mode, WHEN a time-passed event is received and the elapsed time since the Last_Counted_Release is less than the Letter_Gap, THE Switch_Input SHALL return no Finished_Pattern and keep the Pending_Pattern unchanged.
9. WHILE any switch is held in 2-switch mode, THE Switch_Input SHALL keep the Pending_Pattern unchanged and return no Finished_Pattern for every time-passed event, whatever the elapsed time.
10. WHILE the Pending_Pattern is empty in 2-switch mode, WHEN a time-passed event is received, THE Switch_Input SHALL return no Finished_Pattern and leave the Input_State unchanged, whatever the elapsed time.
11. WHEN a press start for the `dot` switch or the `dash` switch is received in 2-switch mode, the Pending_Pattern is not empty, and the elapsed time since the Last_Counted_Release is greater than or equal to the Letter_Gap, THE Switch_Input SHALL return the Pending_Pattern as the Finished_Pattern, set the Pending_Pattern to empty, clear the Last_Counted_Release, and add the switch to the Held_Switches, so that a late press never joins the previous letter.
12. WHEN a press start for the `dot` switch or the `dash` switch is received in 2-switch mode and the elapsed time since the Last_Counted_Release is less than the Letter_Gap, THE Switch_Input SHALL return no Finished_Pattern and continue the same letter.
13. IF a time-passed event or a press start is received in 2-switch mode with a timestamp earlier than the Last_Counted_Release, THEN THE Switch_Input SHALL treat the elapsed time since the Last_Counted_Release as 0 ms.
14. WHEN both the `dot` switch and the `dash` switch are held at the same time in 2-switch mode, THE Switch_Input SHALL track each switch with its own Press_Start, so that each switch adds its own symbol when its own press ends.
15. FOR ALL sequences in 2-switch mode in which a held switch sends any number of Key_Repeat press start events before its press end, THE Switch_Input SHALL produce the same Pending_Pattern, Finished_Pattern values, and Last_Counted_Release as the same sequence with a single press start for that switch (key repeat property).

### Requirement 5: 3-switch mode

**User Story:** As a user with three reliable movements, I want a next-letter switch, so that input needs no pause timing.

#### Acceptance Criteria

1. WHEN a press start for the `dot` switch, the `dash` switch, or the `next` switch is received in 3-switch mode and that switch is not held, THE Switch_Input SHALL add that switch with its Press_Start to the Held_Switches, leave the Pending_Pattern unchanged, and return no Finished_Pattern.
2. WHEN a press end for the `dot` switch is received in 3-switch mode and its raw duration (press end time minus Press_Start) is greater than or equal to the Minimum_Press, THE Switch_Input SHALL append `.` to the end of the Pending_Pattern, remove the `dot` switch from the Held_Switches, return no Finished_Pattern, and produce the same result whatever the press duration.
3. WHEN a press end for the `dash` switch is received in 3-switch mode and its raw duration is greater than or equal to the Minimum_Press, THE Switch_Input SHALL append `-` to the end of the Pending_Pattern, remove the `dash` switch from the Held_Switches, return no Finished_Pattern, and produce the same result whatever the press duration.
4. WHEN a press end for the `next` switch is received in 3-switch mode, its raw duration (press end time minus that switch's Press_Start, with no adjustment or clamping) is greater than or equal to the Minimum_Press, and the Pending_Pattern is not empty, THE Switch_Input SHALL, in that same press end event and without waiting for time to pass, return the Pending_Pattern as the Finished_Pattern, set the Pending_Pattern to empty, and remove the `next` switch from the Held_Switches.
5. WHEN a press end for the `next` switch is received in 3-switch mode, its raw duration is greater than or equal to the Minimum_Press, and the Pending_Pattern is empty, THE Switch_Input SHALL remove the `next` switch from the Held_Switches, keep the Pending_Pattern empty, and return no Finished_Pattern.
6. WHEN a press end is received in 3-switch mode and its raw duration is less than the Minimum_Press, THE Switch_Input SHALL remove that switch from the Held_Switches, leave the Pending_Pattern unchanged, and return no Finished_Pattern, so that a short press on any of the three switches does nothing.
7. IF a press end is received in 3-switch mode for a switch that is not held, or a press start is received for a switch that is already held (Key_Repeat), THEN THE Switch_Input SHALL return the Input_State unchanged with no Finished_Pattern.
8. IF a press end is received in 3-switch mode with a timestamp earlier than the Press_Start of that switch, THEN THE Switch_Input SHALL treat the press as an Ignored_Press under criterion 6, because the raw duration is negative and therefore less than every Minimum_Press, including a Minimum_Press of 0 ms.
9. WHEN a time-passed event is received in 3-switch mode, THE Switch_Input SHALL leave the Input_State unchanged and return no Finished_Pattern, however much time has passed and whether or not a switch is held.
10. WHILE the mode is 3-switch, THE Switch_Input SHALL keep the Last_Counted_Release empty, because no pause timing is used.
11. FOR ALL sequences in 3-switch mode in which a held switch sends any number of Key_Repeat press start events before its press end, THE Switch_Input SHALL produce the same Pending_Pattern and Finished_Pattern values as the same sequence with a single press start for that switch (key repeat property).

### Requirement 6: Pattern entered so far

**User Story:** As a user, I want the dots and dashes I have entered to stay visible, so that the telegraph tape and the chart highlight show where I am.

#### Acceptance Criteria

1. THE Switch_Input SHALL provide a function that takes any Input_State and returns its Pending_Pattern as a string of 0 or more characters, and the function SHALL NOT change the Input_State.
2. THE Switch_Input SHALL keep the Pending_Pattern made only of the characters `.` and `-`, with no spaces, no other characters, and no `null` or `undefined` value, in every Input_State.
3. WHEN a letter ends, THE Switch_Input SHALL return the Pending_Pattern as an empty string in the new Input_State.
4. FOR ALL sequences of events in which a letter ends, THE Finished_Pattern SHALL equal, character for character, the Pending_Pattern of the Input_State held just before the letter ended.
5. FOR ALL sequences of events, WHEN an event produces no Finished_Pattern, THE new Pending_Pattern SHALL either equal the previous Pending_Pattern or equal the previous Pending_Pattern followed by exactly 1 appended character, and SHALL NOT change any earlier character.
6. WHEN the Pending_Pattern is passed unchanged to the Prefix_Matcher, THE Prefix_Matcher SHALL treat it as a valid prefix, and SHALL NOT return an empty list because of an invalid character.
7. WHILE a letter has not ended, THE Switch_Input SHALL keep the Pending_Pattern unchanged for any amount of elapsed time in which no switch event occurs, so that a slow user never loses entered dots and dashes.
8. FOR ALL sequences of events in any mode, THE Switch_Input SHALL grow the Pending_Pattern only on a press end event that is a Counted_Press, so that a press start, a Key_Repeat, an Ignored_Press, and a time-passed event never add a character.

### Requirement 7: Calibration

**User Story:** As a user, I want the app to measure my own taps, holds, and pauses, so that the limits fit my body.

#### Acceptance Criteria

1. WHEN Calibration_Samples contain at least 5 Tap durations, at least 5 Hold durations, and at least 1 pause, all values are finite numbers of 0 ms or more, and the Median Tap is shorter than the Median Hold, THE Switch_Input SHALL set the Dash_Limit to the value halfway between the Median Tap and the Median Hold, rounded to the nearest whole millisecond. The Median of an odd number of values is the middle value in sorted order. The Median of an even number of values is the mean of the two middle values in sorted order.
2. WHEN the conditions in criterion 1 are met, THE Switch_Input SHALL set the Letter_Gap to 3 times the Median pause, rounded to the nearest whole millisecond.
3. WHEN calibration succeeds, THE Switch_Input SHALL clamp the new Dash_Limit and the new Letter_Gap into their ranges from Requirement 1, after the calculations in criteria 1 and 2 and before storing them.
4. WHEN calibration succeeds, THE Switch_Input SHALL leave the Minimum_Press unchanged and set the Calibrated_Flag to true.
5. WHEN calibration succeeds, THE Switch_Input SHALL clear the Recent_Presses (both the Taps and the Holds), so that adaptive timing starts from the new calibration and old presses do not pull the new Dash_Limit back. Under Requirement 8 criterion 3, the Dash_Limit then stays unchanged until at least one new Tap and one new Hold have been classified.
6. IF the Median Tap is not shorter than the Median Hold, THEN THE Switch_Input SHALL return a calibration failed result, keep the old Timing_Settings, keep the old Calibrated_Flag, and keep the old Recent_Presses.
7. IF Calibration_Samples contain fewer than 5 Tap durations, fewer than 5 Hold durations, or no pauses, THEN THE Switch_Input SHALL return a calibration failed result, keep the old Timing_Settings, keep the old Calibrated_Flag, and keep the old Recent_Presses.
8. IF any Calibration_Samples value is negative, NaN, or not a finite number, THEN THE Switch_Input SHALL return a calibration failed result, keep the old Timing_Settings, keep the old Calibrated_Flag, and keep the old Recent_Presses, even when the other samples are valid.
9. WHEN calibration succeeds, THE Switch_Input SHALL produce Timing_Settings in which every value is inside its range from Requirement 1.
10. WHEN calibration runs on two sets of Calibration_Samples that contain the same values in a different order, THE Switch_Input SHALL produce identical Timing_Settings and the same success or failure result for both.
11. WHEN calibration succeeds, THE Switch_Input SHALL keep the Pending_Pattern, the Held_Switches, and the Last_Counted_Release unchanged.

### Requirement 8: Adaptive timing

**User Story:** As a user who gets tired, I want the dash limit to follow my recent presses slowly, so that I do not have to recalibrate.

#### Acceptance Criteria

1. WHILE the Calibrated_Flag is true and the mode is 1-switch, WHEN a press is classified as a dot or a dash, THE Switch_Input SHALL add its duration to the Recent_Presses (a dot to the Taps, a dash to the Holds) and keep only the 10 most recent Taps and the 10 most recent Holds, discarding the oldest first.
2. WHILE the Calibrated_Flag is true and the mode is 1-switch, WHEN a press is classified and the Recent_Presses contain at least one Tap and at least one Hold, THE Switch_Input SHALL move the Dash_Limit toward the midpoint of the Median recent Tap and the Median recent Hold, where the midpoint is (Median recent Tap + Median recent Hold) / 2 in milliseconds.
3. WHILE the Calibrated_Flag is true and the mode is 1-switch, WHEN a press is classified and the Recent_Presses do not contain at least one Tap and at least one Hold, THE Switch_Input SHALL leave the Dash_Limit unchanged.
4. THE Switch_Input SHALL limit each adaptive move of the Dash_Limit to at most 5 percent of the Dash_Limit before the move, and SHALL move the Dash_Limit by the full distance to the midpoint when that distance is within 5 percent.
5. THE Switch_Input SHALL keep the Dash_Limit inside the range 150 to 3000 ms, inclusive, after every adaptive move.
6. WHEN the Dash_Limit already equals the midpoint, THE Switch_Input SHALL leave the Dash_Limit unchanged.
7. WHILE the Calibrated_Flag is false, THE Switch_Input SHALL leave the Timing_Settings and the Recent_Presses unchanged when a press is classified.
8. WHEN a press is an Ignored_Press, THE Switch_Input SHALL leave the Recent_Presses and the Timing_Settings unchanged.
9. WHEN a press is classified, THE Switch_Input SHALL classify it using the Dash_Limit from before the adaptive move.
10. THE Switch_Input SHALL leave the Letter_Gap and the Minimum_Press unchanged during adaptive moves.
11. WHILE the mode is 2-switch or 3-switch, THE Switch_Input SHALL leave the Timing_Settings and the Recent_Presses unchanged on every press start, press end, and time-passed event.
12. FOR ALL sequences of classified presses, the Dash_Limit SHALL stay inside the range 150 to 3000 ms and each single step SHALL change it by at most 5 percent of its value before that step.

### Requirement 9: Immutable state transitions

**User Story:** As a developer, I want state in and new state out, so that the logic is easy to test and replay.

#### Acceptance Criteria

1. THE Switch_Input SHALL expose each transition as a function that takes exactly one Input_State and one Input_Event and returns exactly one Input_Output, which contains the next Input_State and an optional Finished_Pattern.
2. THE Switch_Input SHALL declare every field of Input_State, Input_Event, and Input_Output as `readonly`, including fields of nested objects and arrays, so that assigning to any field is a TypeScript compile error under strict mode.
3. WHEN a transition runs, THE Switch_Input SHALL leave the passed-in Input_State deeply equal to a copy taken before the call, and SHALL return a next Input_State that is not the same object reference when any field changed.
4. THE Switch_Input SHALL provide one initial Input_State for each of the three modes (1-switch, 2-switch, 3-switch), each with the default Timing_Settings, a Calibrated_Flag of false, an empty Pending_Pattern (length 0), no Held_Switches, and no Last_Counted_Release.
5. THE Switch_Input SHALL receive every timestamp as a parameter in milliseconds and SHALL use no clock, timer, or random source.
6. THE Switch_Input SHALL contain no import from React, no reference to `window`, `document`, `localStorage`, or `fetch`, and no reference to `Date`, `performance`, `Math.random`, `setTimeout`, or `setInterval`, and the Purity_Test, extended under Requirement 10 criterion 4, SHALL enforce this for every non-test source file in `src/core/morse/`.
7. WHEN the same Input_State and the same Input_Event are supplied twice, THE Switch_Input SHALL return deeply equal Input_Output values.
8. WHEN a mode change event is received, THE Switch_Input SHALL keep the Timing_Settings, the Calibrated_Flag, and the Recent_Presses unchanged, SHALL set the Pending_Pattern to length 0, SHALL drop all Held_Switches, SHALL clear the Last_Counted_Release, and SHALL return no Finished_Pattern.
9. IF an Input_Event names a Switch_Id that does not belong to the current mode (`main` outside 1-switch mode, `dot` or `dash` in 1-switch mode, or `next` outside 3-switch mode), THEN THE Switch_Input SHALL return an Input_State deeply equal to the one passed in, with no Finished_Pattern.
10. IF a press start, press end, or time-passed event carries a timestamp that is not a finite number or is negative, THEN THE Switch_Input SHALL return an Input_State deeply equal to the one passed in, with no Finished_Pattern, and SHALL NOT throw an error. A timestamp that is finite but earlier than a stored time is handled by Requirement 2 criteria 10 and 12, Requirement 4 criteria 6 and 13, and Requirement 5 criterion 8.
11. THE Switch_Input SHALL export its functions and types by name from `src/core/morse/`, with no default exports.

### Requirement 10: Property-based tests

**User Story:** As a developer, I want required property-based tests, so that the timing rules hold for many random inputs.

#### Acceptance Criteria

1. THE Switch_Input SHALL include unit tests and fast-check property-based tests in `.test.ts` files located in the same folder as, and named after, the file each one tests (for example `morse-decoder.ts` has `morse-decoder.test.ts`), following `.kiro/steering/testing-standards.md`.
2. THE Switch_Input SHALL include at least one property-based test for each "FOR ALL" criterion in Requirements 1, 3, 4, 5, 6, 7, 8, and 9, and each test SHALL name the requirement and criterion number it covers.
3. THE Switch_Input SHALL include a property-based test for each of the 1-switch, 2-switch, and 3-switch modes that replays random press start, press end, and time-passed sequences with random non-decreasing timestamps (including repeated press starts for held switches), runs at least 100 generated sequences, and checks that every Finished_Pattern is non-empty and contains only the characters `.` and `-`.
4. THE Switch_Input SHALL extend the existing Purity_Test, `src/core/morse/morse-purity.test.ts`, by adding rules to its `PURITY_RULES` list that forbid `Date`, `performance`, `Math.random`, `setTimeout`, and `setInterval` in code (not in comments), keeping all its existing checks (`window`, `document`, `localStorage`, `fetch`, React imports, and `any`). The Purity_Test already scans every non-test `.ts` file in `src/core/morse/` except `morse-test-arbitraries.ts`, so the new Switch_Input source files SHALL be covered without a separate scanner, and the extension SHALL add self-check tests for the new rules in the same style as the existing self-checks.
5. THE Switch_Input SHALL include a test that, for each of the 1-switch, 2-switch, and 3-switch input modes, passes a Finished_Pattern produced by Counted_Presses to `decodePattern` and checks that the decoded character or action equals the entry for that pattern in the Morse table.
6. WHEN the tasks for this spec are written, THE task list SHALL mark every property-based test task as required, with no optional marker (no `*` suffix on the task).
7. WHEN a source file in `src/core/morse/` is added or changed for this feature, THE change SHALL include the unit tests and property-based tests for that file in the same task, and `npm test` SHALL pass with zero failing tests after that task.
