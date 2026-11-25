# Requirements Document

## Introduction

Switch input turns raw switch events (press starts, press ends, and time passing) into Morse patterns made of `.` and `-`. It supports 1-switch, 2-switch, and 3-switch modes, a hold-progress value for the on-screen halo, calibration, and slow adaptive timing. The finished pattern of each letter is passed to the existing `decodePattern` function in `src/core/morse/`.

All logic lives in `src/core/morse/` as pure TypeScript. It contains no React, no browser code, and no clock or timers. The caller passes every timestamp in milliseconds. State goes in and new state out, in the same style as `message-editor.ts`. Nothing is changed in place.

Every mode uses the same press model. A switch has a press start event and a press end event. A press counts only when it ends and its duration is at least the Minimum_Press. In 1-switch mode the duration also decides dot or dash. In 2-switch and 3-switch modes each switch adds its own symbol, once per counted press, when the press ends. A physical keyboard key that is held down repeats its key-down event, so a press start for a switch that is already held is ignored. Holding a key therefore adds one symbol, not many.

Adaptive timing decisions:
- After a successful calibration, the Dash_Limit may drift only inside the Drift_Band around the Calibrated_Dash_Limit, so that tiredness is followed slowly and a run of odd presses cannot pull the limit far from the calibration.
- The Dash_Limit is always a whole number of milliseconds and is always at least 2 times the Minimum_Press, so that a dot stays possible.
- The Letter_Gap does not adapt in this spec. Only a new calibration updates the Letter_Gap.
- The Recent_Presses have no age limit. They are kept across mode changes, which matches Requirement 9 criterion 8.
- A very long press is still a dash, but it is not used to adapt the timing.
- When the Dash_Limit reaches an edge of the Drift_Band, the Input_Output carries a flag that suggests recalibration. The flag changes no state and does not stop input.

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
- **Input_State**: The immutable value that holds the current mode, the Timing_Settings, the Pending_Pattern, the Held_Switches, the Last_Counted_Release, the Recent_Presses, the Calibrated_Flag, and the Calibrated_Dash_Limit.
- **Input_Event**: One of four events passed to a transition: a press start (with a Switch_Id and a timestamp), a press end (with a Switch_Id and a timestamp), a time-passed event (with a timestamp), or a mode change (with the new mode).
- **Input_Output**: The value returned by every Switch_Input transition. It holds the new Input_State, the Finished_Pattern (which is `null` when no letter ended), and the Recalibration_Flag.
- **Timing_Settings**: The three adjustable values: Dash_Limit, Letter_Gap, and Minimum_Press.
- **Dash_Limit**: The press length in milliseconds at which a press becomes a dash in 1-switch mode. Always a whole number of milliseconds and always at least 2 times the Minimum_Press. Default 400. Range 150 to 3000.
- **Letter_Gap**: The pause in milliseconds after the Last_Counted_Release that ends a letter in 1-switch and 2-switch modes. Default 1500. Range 500 to 10000.
- **Minimum_Press**: The shortest press length in milliseconds that counts as a press, in every mode. Always at most half of the Dash_Limit. Default 30. Range 0 to 200.
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
- **Recent_Presses**: Two windows of durations in milliseconds, oldest first: the Taps window and the Holds window. Each window holds at most 10 entries. Recent_Presses have no age limit.
- **Outlier_Press**: A Counted_Press in 1-switch mode whose raw duration is greater than 3 times the Dash_Limit from before the adaptive move. An Outlier_Press is still a Hold.
- **Calibration_Samples**: The measured Tap durations, Hold durations, and pauses between presses, all in milliseconds, supplied by the caller. The caller supplies each list in time order, oldest first. "Most recent" means the last entries of a list.
- **Median**: The middle value of a sorted list. For an even count, the mean of the two middle values.
- **Calibrated_Flag**: A boolean in Input_State that is true after one successful calibration.
- **Calibrated_Dash_Limit**: The Dash_Limit value set by the most recent successful calibration, stored in Input_State. It has no value until the first successful calibration.
- **Drift_Band**: The range in which the Dash_Limit may lie after a calibration. It has three lower bounds and two upper bounds. The lower bounds are 75 percent of the Calibrated_Dash_Limit (rounded to the nearest whole millisecond, with .5 rounded up), 150 ms, and 2 times the Minimum_Press. The upper bounds are 150 percent of the Calibrated_Dash_Limit (rounded the same way) and 3000 ms. The effective lower bound is the largest of the lower bounds. The effective upper bound is the smallest of the upper bounds. If the effective lower bound is greater than the effective upper bound, the Drift_Band is the single value of the effective upper bound (the upper bound wins). The Drift_Band does not exist while the Calibrated_Flag is false.
- **Recalibration_Flag**: A boolean in Input_Output. It is true when the Dash_Limit equals the effective lower bound or the effective upper bound of the Drift_Band after a successful calibration or after a Counted_Press in 1-switch mode while the Calibrated_Flag is true. Otherwise it is false.
- **Purity_Test**: The existing test file `src/core/morse/morse-purity.test.ts`, which scans source files in `src/core/morse/` for forbidden references.

## Requirements

### Requirement 1: Timing settings and clamping

**User Story:** As a user or caregiver, I want timing limits with safe defaults and ranges, so that the timing fits the user and bad values never break input.

#### Acceptance Criteria

1. THE Switch_Input SHALL provide default Timing_Settings with a Dash_Limit of 400 ms, a Letter_Gap of 1500 ms, and a Minimum_Press of 30 ms.
2. WHEN a finite numeric Timing_Settings value is supplied, THE Switch_Input SHALL clamp the values in this order: first the Dash_Limit into the range 150 to 3000 ms inclusive and rounded to the nearest whole millisecond (.5 rounded up), then the Letter_Gap into the range 500 to 10000 ms inclusive, then the Minimum_Press into the range 0 to 200 ms inclusive and to at most half of the resulting Dash_Limit. A value below the range minimum SHALL become the minimum, and a value above the range maximum SHALL become the maximum.
3. IF a supplied Timing_Settings value is NaN, Infinity, -Infinity, or not a number type, THEN THE Switch_Input SHALL use the default for that value (400 ms, 1500 ms, or 30 ms) and SHALL NOT throw an error.
4. WHEN a Timing_Settings value is already inside its range (inclusive of both bounds), is a whole number if it is the Dash_Limit, and, if it is the Minimum_Press, is at most half of the resulting Dash_Limit, THE Switch_Input SHALL return that value unchanged.
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

1. WHEN Calibration_Samples contain at least 5 Tap durations, at least 5 Hold durations, and at least 1 pause, all values are finite numbers of 0 ms or more, the Median Tap is shorter than the Median Hold, and no switch is held, THE Switch_Input SHALL set the Dash_Limit to the value halfway between the Median Tap and the Median Hold, rounded to the nearest whole millisecond (.5 rounded up). The Median of an odd number of values is the middle value in sorted order. The Median of an even number of values is the mean of the two middle values in sorted order. The Medians use all supplied samples.
2. WHEN the conditions in criterion 1 are met, THE Switch_Input SHALL set the Letter_Gap to 3 times the Median pause, rounded to the nearest whole millisecond (.5 rounded up).
3. WHEN calibration succeeds, THE Switch_Input SHALL clamp the new Dash_Limit into 150 to 3000 ms and the new Letter_Gap into 500 to 10000 ms (Requirement 1), then SHALL raise the new Dash_Limit to 2 times the Minimum_Press when the clamped value is lower, before storing them.
4. WHEN calibration succeeds, THE Switch_Input SHALL leave the Minimum_Press unchanged, set the Calibrated_Flag to true, and store the final new Dash_Limit as the Calibrated_Dash_Limit.
5. WHEN calibration succeeds, THE Switch_Input SHALL replace the Recent_Presses with the calibration's own samples: for the Taps window and the Holds window separately, THE Switch_Input SHALL first remove every sample that is greater than 3 times the new Dash_Limit (the Outlier_Press rule of Requirement 8 criterion 2), and then SHALL keep the 10 most recent remaining samples, where the most recent samples are the last entries of the supplied list, oldest first. A window with fewer than 10 remaining samples keeps all of them, and the old Recent_Presses are discarded.
6. IF the Median Tap is not shorter than the Median Hold, THEN THE Switch_Input SHALL return a calibration failed result, keep the old Timing_Settings, keep the old Calibrated_Flag, keep the old Calibrated_Dash_Limit, and keep the old Recent_Presses.
7. IF Calibration_Samples contain fewer than 5 Tap durations, fewer than 5 Hold durations, or no pauses, THEN THE Switch_Input SHALL return a calibration failed result, keep the old Timing_Settings, keep the old Calibrated_Flag, keep the old Calibrated_Dash_Limit, and keep the old Recent_Presses.
8. IF any Calibration_Samples value is negative, NaN, or not a finite number, THEN THE Switch_Input SHALL return a calibration failed result, keep the old Timing_Settings, keep the old Calibrated_Flag, keep the old Calibrated_Dash_Limit, and keep the old Recent_Presses, even when the other samples are valid.
9. IF calibration is requested while any switch is held, THEN THE Switch_Input SHALL return a calibration failed result, keep the old Timing_Settings, keep the old Calibrated_Flag, keep the old Calibrated_Dash_Limit, keep the old Recent_Presses, and keep the Held_Switches, whatever the Calibration_Samples are.
10. WHEN calibration succeeds, THE Switch_Input SHALL produce Timing_Settings in which every value is inside its range from Requirement 1, the Dash_Limit is a whole number of milliseconds, and the Dash_Limit is at least 2 times the Minimum_Press.
11. WHEN calibration runs on two sets of Calibration_Samples that contain the same values in a different order, THE Switch_Input SHALL produce identical Timing_Settings, an identical Calibrated_Dash_Limit, and the same success or failure result for both. This order independence does not apply to the seeded Recent_Presses, because criterion 5 depends on the order of the samples.
12. WHEN calibration succeeds, THE Switch_Input SHALL keep the Pending_Pattern, the Held_Switches (which are empty under criterion 1), and the Last_Counted_Release unchanged.
13. WHEN calibration succeeds, THE Switch_Input SHALL return the Recalibration_Flag as true if the new Dash_Limit equals the effective lower bound or the effective upper bound of the new Drift_Band, and as false otherwise.
14. FOR ALL successful calibrations, each seeded window SHALL hold at most 10 entries, SHALL hold no sample greater than 3 times the new Dash_Limit, and SHALL equal the last entries, in supplied order, of the supplied samples that remain after outlier removal.

### Requirement 8: Adaptive timing

**User Story:** As a user who gets tired, I want the dash limit to follow my recent presses slowly, so that I do not have to recalibrate.

#### Acceptance Criteria

1. WHILE the Calibrated_Flag is true and the mode is 1-switch, WHEN a Counted_Press ends, THE Switch_Input SHALL work in this order: first classify the press as a dot or a dash using the Dash_Limit from before any adaptive move, then update the Recent_Presses, then move the Dash_Limit.
2. WHILE the Calibrated_Flag is true and the mode is 1-switch, WHEN a Counted_Press is classified, THE Switch_Input SHALL add its duration to the Taps window (a dot) or the Holds window (a dash) and SHALL keep only the 10 most recent entries in each window, discarding the oldest first. IF the press is an Outlier_Press, THEN THE Switch_Input SHALL still classify it as a dash and append `-`, SHALL NOT add its duration to the Recent_Presses, and SHALL leave the Dash_Limit unchanged.
3. WHILE the Calibrated_Flag is true and the mode is 1-switch, WHEN a press is classified and the Recent_Presses contain fewer than 3 Taps or fewer than 3 Holds, THE Switch_Input SHALL leave the Dash_Limit unchanged.
4. IF the Median recent Tap is not shorter than the Median recent Hold, THEN THE Switch_Input SHALL leave the Dash_Limit unchanged.
5. WHEN the Recent_Presses contain at least 3 Taps and at least 3 Holds, the press is not an Outlier_Press, and the Median recent Tap is shorter than the Median recent Hold, THE Switch_Input SHALL compute the midpoint as (Median recent Tap + Median recent Hold) / 2 in milliseconds, and SHALL turn it into a whole-millisecond target as follows: if the midpoint is greater than the Dash_Limit, the target is the midpoint rounded down; if the midpoint is less than the Dash_Limit, the target is the midpoint rounded up; if the midpoint equals the Dash_Limit, there is no move. THE Switch_Input SHALL then clamp the target into the Drift_Band, so that the target never passes the midpoint.
6. WHEN a target is computed under criterion 5, THE Switch_Input SHALL move the Dash_Limit toward the target by the smaller of two amounts: the distance to the target, and 5 percent of the Dash_Limit before the move rounded down to a whole millisecond. The move therefore never exceeds 5 percent of the Dash_Limit before the move, never passes the target, never passes the midpoint, leaves the Dash_Limit a whole number of milliseconds, and is at least 1 ms whenever the distance to the target is 1 ms or more. When the distance to the target is 0 ms, the Dash_Limit stays unchanged.
7. THE Switch_Input SHALL keep the Dash_Limit inside the Drift_Band after every adaptive move that starts with the Dash_Limit inside the Drift_Band. IF a settings change has left the Dash_Limit outside the Drift_Band, THEN THE Switch_Input SHALL still move it toward the clamped target under criterion 6.
8. THE Switch_Input SHALL keep the Dash_Limit at least 2 times the Minimum_Press and inside 150 to 3000 ms after every adaptive move, because the Drift_Band includes both limits.
9. WHEN a Counted_Press ends in 1-switch mode while the Calibrated_Flag is true, THE Switch_Input SHALL return the Recalibration_Flag as true if the Dash_Limit after the press equals the effective lower bound or the effective upper bound of the Drift_Band, and as false otherwise. The Recalibration_Flag changes no state and does not stop input.
10. WHILE the Calibrated_Flag is false, THE Switch_Input SHALL leave the Timing_Settings and the Recent_Presses unchanged when a press is classified.
11. WHEN a press is an Ignored_Press, THE Switch_Input SHALL leave the Recent_Presses and the Timing_Settings unchanged.
12. THE Switch_Input SHALL leave the Letter_Gap, the Minimum_Press, and the Calibrated_Dash_Limit unchanged during adaptive moves.
13. WHILE the mode is 2-switch or 3-switch, THE Switch_Input SHALL leave the Timing_Settings, the Recent_Presses, and the Calibrated_Dash_Limit unchanged on every press start, press end, and time-passed event.
14. FOR ALL sequences of classified presses that start from a calibrated state with the Dash_Limit inside the Drift_Band, each single step SHALL change the Dash_Limit by at most 5 percent of its value before that step, SHALL NOT move the Dash_Limit away from the midpoint, and SHALL NOT move the Dash_Limit past the midpoint.
15. FOR ALL sequences of classified presses that start from a calibrated state with the Dash_Limit inside the Drift_Band, THE Dash_Limit SHALL stay inside the Drift_Band and SHALL stay at least 2 times the Minimum_Press after every step.
16. FOR ALL sequences in which the same Tap duration and the same Hold duration (the Tap shorter than the Hold, neither an Outlier_Press) are repeated, and every Tap is classified as a dot and every Hold as a dash at every step, THE Dash_Limit SHALL reach the clamped whole-millisecond target of criterion 5 after a finite number of presses and SHALL stay there.
17. FOR ALL sequences of classified presses, THE Taps window and the Holds window SHALL each hold at most 10 entries after every step.

### Requirement 9: Immutable state transitions

**User Story:** As a developer, I want state in and new state out, so that the logic is easy to test and replay.

#### Acceptance Criteria

1. THE Switch_Input SHALL expose each transition as a function that takes exactly one Input_State and one Input_Event and returns exactly one Input_Output, which contains the next Input_State, an optional Finished_Pattern, and the Recalibration_Flag.
2. THE Switch_Input SHALL declare every field of Input_State, Input_Event, and Input_Output as `readonly`, including fields of nested objects and arrays, so that assigning to any field is a TypeScript compile error under strict mode.
3. WHEN a transition runs, THE Switch_Input SHALL leave the passed-in Input_State deeply equal to a copy taken before the call, and SHALL return a next Input_State that is not the same object reference when any field changed.
4. THE Switch_Input SHALL provide one initial Input_State for each of the three modes (1-switch, 2-switch, 3-switch), each with the default Timing_Settings, a Calibrated_Flag of false, no Calibrated_Dash_Limit, empty Recent_Presses, an empty Pending_Pattern (length 0), no Held_Switches, and no Last_Counted_Release.
5. THE Switch_Input SHALL receive every timestamp as a parameter in milliseconds and SHALL use no clock, timer, or random source.
6. THE Switch_Input SHALL contain no import from React, no reference to `window`, `document`, `localStorage`, or `fetch`, and no reference to `Date`, `performance`, `Math.random`, `setTimeout`, or `setInterval`, and the Purity_Test, extended under Requirement 10 criterion 4, SHALL enforce this for every non-test source file in `src/core/morse/`.
7. WHEN the same Input_State and the same Input_Event are supplied twice, THE Switch_Input SHALL return deeply equal Input_Output values.
8. WHEN a mode change event is received, THE Switch_Input SHALL keep the Timing_Settings, the Calibrated_Flag, the Calibrated_Dash_Limit, and the Recent_Presses unchanged, SHALL set the Pending_Pattern to length 0, SHALL drop all Held_Switches, SHALL clear the Last_Counted_Release, SHALL return no Finished_Pattern, and SHALL return the Recalibration_Flag as false.
9. IF an Input_Event names a Switch_Id that does not belong to the current mode (`main` outside 1-switch mode, `dot` or `dash` in 1-switch mode, or `next` outside 3-switch mode), THEN THE Switch_Input SHALL return an Input_State deeply equal to the one passed in, with no Finished_Pattern and the Recalibration_Flag as false.
10. IF a press start, press end, or time-passed event carries a timestamp that is not a finite number or is negative, THEN THE Switch_Input SHALL return an Input_State deeply equal to the one passed in, with no Finished_Pattern and the Recalibration_Flag as false, and SHALL NOT throw an error. A timestamp that is finite but earlier than a stored time is handled by Requirement 2 criteria 10 and 12, Requirement 4 criteria 6 and 13, and Requirement 5 criterion 8.
11. THE Switch_Input SHALL export its functions and types by name from `src/core/morse/`, with no default exports.
12. THE Switch_Input SHALL set the Recalibration_Flag to false for every event that is not a Counted_Press in 1-switch mode with the Calibrated_Flag true, and the Recalibration_Flag SHALL NOT change the Input_State and SHALL NOT stop or delay input.

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
8. THE Switch_Input SHALL include property-based tests, each naming Requirement 8 and its criterion number, that run random sequences of classified presses from a calibrated state and check that the Dash_Limit never moves away from the midpoint, never moves past the midpoint, changes by at most 5 percent per step, converges to the clamped target when the same Tap and Hold durations are repeated, stays inside the Drift_Band, stays at least 2 times the Minimum_Press, is always a whole number of milliseconds, and that the Taps window and the Holds window never hold more than 10 entries.
9. THE Switch_Input SHALL include property-based tests that check: an Outlier_Press is classified as a dash, appends `-`, and is never stored in the Recent_Presses; no adaptive move happens while the Recent_Presses hold fewer than 3 Taps or fewer than 3 Holds; the Dash_Limit does not move when the Median recent Tap is not shorter than the Median recent Hold; calibration while any switch is held returns a failed result with the Timing_Settings, Calibrated_Flag, Calibrated_Dash_Limit, Recent_Presses, and Held_Switches unchanged; calibration seeding follows Requirement 7 criteria 5 and 14; and Requirement 1 clamping keeps the Minimum_Press at most half of the Dash_Limit and stays idempotent.
