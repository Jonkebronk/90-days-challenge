# Dual-Panel Workout Builder Architecture

## Overview

This document specifies the complete dual-panel layout architecture for the workout builder. This is a REPLACEMENT for the traditional bottom sheet approach.

**Current State:** ExerciseBottomSheet (modal/bottom sheet)  
**Target State:** DualPanelWorkoutBuilder (side-by-side panels)

---

## Visual Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ Workout Builder - Day: Chest Day                                 │
├────────────────────────────┬──────────────────────────────────────┤
│                            │                                      │
│  LEFT PANEL                │  RIGHT PANEL                         │
│  (Exercise Library)        │  (Active Workout)                    │
│                            │                                      │
│ ┌────────────────────────┐ │ ┌──────────────────────────────────┐ │
│ │ 🔍 Search Exercises    │ │ │ Day: Chest Day                   │ │
│ │                        │ │ │ Est. Duration: 52 minutes        │ │
│ │ Filters:               │ │ │ Total Exercises: 7               │ │
│ │ ☑ Chest               │ │ │                                  │ │
│ │ ☑ Triceps             │ │ │ SINGLE EXERCISES:                │ │
│ │ ☐ Back                │ │ │                                  │ │
│ │                        │ │ │ 1. Bench Press                   │ │
│ │ Equipment:             │ │ │    ⋮ 4 × 6-8 ⊗ 60s rest        │ │
│ │ ☑ Barbell             │ │ │    [Drag handle] [Delete]        │ │
│ │ ☑ Dumbbell            │ │ │                                  │ │
│ │                        │ │ │ ═══ SUPERSET A (Gold) ═══       │ │
│ │ Recently Used:         │ │ │ 2. Barbell Rows                  │ │
│ │ • Barbell Press (↕)   │ │ │    ⋮ 4 × 8 ⊗ 45s rest           │ │
│ │ • Dumbbell Fly (↕)    │ │ │ 3. Incline Press                 │ │
│ │ • Tricep Rope (↕)     │ │ │    ⋮ 4 × 8-10 ⊗ 45s rest        │ │
│ │                        │ │ │                                  │ │
│ │ Search Results:        │ │ │ ═══ DROPSET B (Blue) ═══        │ │
│ │ ┌────────────────────┐ │ │ │ 50kg → 4. Dumbbell Press (8)     │ │
│ │ │ Barbell Row (↕)   │ │ │ │ 40kg → 5. Dumbbell Press (12)    │ │
│ │ │ [Single]           │ │ │ │ 30kg → 6. Dumbbell Press (15)    │ │
│ │ │ [Superset]         │ │ │ │                                  │ │
│ │ │ [Dropset]          │ │ │ │ 7. Tricep Rope                   │ │
│ │ └────────────────────┘ │ │ │    ⋮ 3 × 12 ⊗ 30s rest          │ │
│ │                        │ │ │                                  │ │
│ │ ┌────────────────────┐ │ │ │ [+ Add Exercise]                 │ │
│ │ │ Chest Fly (↕)     │ │ │ │ [Create Superset] (2+ selected) │ │
│ │ │ [Single]           │ │ │ │ [Create Dropset] (2+ selected)   │ │
│ │ │ [Superset]         │ │ │ │                                  │ │
│ │ │ [Dropset]          │ │ │ └──────────────────────────────────┘ │
│ │ └────────────────────┘ │ │                                      │
│ │                        │ │ Saving... Last saved 2 mins ago      │
│ └────────────────────────┘ │                                      │
│                            │                                      │
└────────────────────────────┴──────────────────────────────────────┘
```

---

## Component Structure

### 1. DualPanelWorkoutBuilder (Main Container)
**File:** `components/workout-builder/DualPanelWorkoutBuilder.tsx`

**Layout:**
```
<div className="flex h-screen gap-4 p-4 bg-gray-900">
  <ExerciseLibraryPanel />      {/* Left: 300-400px */}
  <WorkoutPlanPanel />          {/* Right: flex-1 */}
  <AutoSaveStatus />            {/* Bottom-right corner */}
</div>
```

**State Management:**
- Current day exercises
- - Supersets array
  - - Dropsets array
    - - Selected exercise indices (for bulk operations)
      - - Auto-save status (saving, lastSaved)
       
        - ---

        ### 2. LEFT PANEL: ExerciseLibraryPanel
        **File:** `components/workout-builder/ExerciseLibraryPanel.tsx`

        **Dimensions:**
        - Width: `max-w-400px` (responsive)
        - - Height: `h-full` (fills screen)
          - - Scrollable: Yes, vertical scroll only
           
            - **Contents:**
           
            - #### 2.1 Search Input
            - ```
              🔍 Search Exercises
              [Search field with debounce 300ms]
              - Searches: exercise name, muscle groups
              - Real-time filtering
              ```

              #### 2.2 Filter Section
              ```
              Filters:
              ☐ Chest        ☑ Triceps       ☐ Back
              ☐ Legs         ☐ Shoulders     ☐ Biceps

              Equipment:
              ☑ Barbell      ☑ Dumbbell      ☐ Machine
              ☐ Cable        ☐ Bodyweight    ☐ Band

              Difficulty:
              ☐ Beginner     ☐ Intermediate  ☐ Advanced
              ```

              **Filter Logic:**
              - Muscle groups: OR (Chest OR Triceps)
              - - Equipment: OR (Barbell OR Dumbbell)
                - - Combined: AND (Muscle AND Equipment)
                 
                  - #### 2.3 Recently Used Section
                  - ```
                    Recently Used: (showing last 5 used)
                    • Barbell Press (↕)
                    • Dumbbell Fly (↕)
                    • Tricep Rope (↕)
                    ```

                    - Max 5 items
                    - - Sorted by usage date (newest first)
                      - - Persisted to localStorage
                        - - Each has drag handle
                         
                          - #### 2.4 Search Results
                          - ```
                            Search Results: (42 exercises)
                            ┌────────────────────────────┐
                            │ Barbell Row (↕)           │
                            │ [Single] [Superset] [Drop] │
                            └────────────────────────────┘

                            ┌────────────────────────────┐
                            │ Chest Fly (↕)             │
                            │ [Single] [Superset] [Drop] │
                            └────────────────────────────┘
                            ```

                            **Each Exercise Result:**
                            - Exercise name
                            - - Drag handle (GripVertical icon) - for reordering in library
                              - - 3 Action Buttons:
                                -   - **[Single]** - Add as single exercise
                                    -   - **[Superset]** - Add to superset (opens dialog)
                                        -   - **[Dropset]** - Add to dropset (opens dialog)
                                         
                                            - **Virtual Scrolling:**
                                            - - Applied when results > 50 items
                                              - - Using `@tanstack/react-virtual`
                                                - - Item height: ~60px
                                                 
                                                  - ---

                                                  ### 3. RIGHT PANEL: WorkoutPlanPanel
                                                  **File:** `components/workout-builder/WorkoutPlanPanel.tsx`

                                                  **Dimensions:**
                                                  - Width: `flex-1` (remaining space)
                                                  - - Height: `h-full`
                                                    - - Scrollable: Yes, vertical scroll
                                                     
                                                      - **Contents:**
                                                     
                                                      - #### 3.1 Header Section
                                                      - ```
                                                        Day: Chest Day
                                                        Est. Duration: 52 minutes
                                                        Total Exercises: 7
                                                        [Checkbox: Multi-select mode]
                                                        ```

                                                        #### 3.2 Exercises Display
                                                        Shows 3 types of exercises, each grouped differently:

                                                        **TYPE 1: Single Exercises**
                                                        ```
                                                        1. Bench Press
                                                           ⋮ 4 sets × 6-8 reps ⊗ 60s rest
                                                           Notes: Form is key
                                                           [Drag handle ↕] [Delete ×]
                                                           [☐ Select for superset]
                                                        ```

                                                        **TYPE 2: Supersets (Gold Border)**
                                                        ```
                                                        ═══ SUPERSET A (Gold) ═══
                                                        2. Barbell Rows
                                                           ⋮ 4 sets × 8 reps ⊗ 45s rest
                                                        3. Incline Press
                                                           ⋮ 4 sets × 8-10 reps ⊗ 45s rest
                                                        [Drag handle ↕] [Remove Superset ×]
                                                        ```

                                                        **TYPE 3: Dropsets (Blue Border)**
                                                        ```
                                                        ═══ DROPSET B (Blue) ═══ ↓ Descending
                                                        50kg → 4. Dumbbell Press (8 reps)
                                                        40kg → 5. Dumbbell Press (12 reps)
                                                        30kg → 6. Dumbbell Press (15 reps)
                                                        [Drag handle ↕] [Remove Dropset ×]
                                                        ```

                                                        #### 3.3 Action Buttons
                                                        ```
                                                        [+ Add Exercise]
                                                        [Create Superset] - Shows if 2+ selected
                                                        [Create Dropset]  - Shows if 2+ selected
                                                        ```

                                                        ---

                                                        ## Interaction Flow

                                                        ### Flow 1: Add Single Exercise
                                                        ```
                                                        1. User clicks [Single] on exercise in left panel
                                                        2. Exercise added to right panel
                                                        3. Added to "Recently Used" list
                                                        4. Auto-saves
                                                        ```

                                                        ### Flow 2: Create Superset
                                                        ```
                                                        1. User selects 2+ exercises in right panel (click [Select] or checkbox)
                                                        2. Both exercises get checkbox mark
                                                        3. Counter shows "2 selected"
                                                        4. [Create Superset] button appears
                                                        5. User clicks [Create Superset]
                                                        6. Exercises grouped with gold border
                                                        7. Auto-saves
                                                        ```

                                                        ### Flow 3: Create Dropset
                                                        ```
                                                        1. User selects 2+ exercises in right panel
                                                        2. [Create Dropset] button appears
                                                        3. User clicks [Create Dropset]
                                                        4. Dialog opens for weight configuration:
                                                           - Default: 50kg, 40kg, 30kg (80% decrements)
                                                           - User can edit weights/reps
                                                        5. Exercises grouped with blue border showing weight progression
                                                        6. Auto-saves
                                                        ```

                                                        ### Flow 4: Drag Exercise (Left → Right)
                                                        ```
                                                        1. User drags exercise from left panel
                                                        2. Drop zone highlights in right panel
                                                        3. Drop releases exercise
                                                        4. Exercise added to right panel as single exercise
                                                        5. Recently used updated
                                                        6. Auto-saves
                                                        ```

                                                        ### Flow 5: Reorder Exercises (Within Right Panel)
                                                        ```
                                                        1. User drags exercise within right panel
                                                        2. Visual feedback shows drop position
                                                        3. Drop reorders exercise list
                                                        4. Auto-saves
                                                        ```

                                                        ---

                                                        ## Styling Guide

                                                        ### Colors
                                                        ```
                                                        Background: #111827 (dark gray)
                                                        Borders: rgba(255,215,0,0.2) (gold, subtle)
                                                        Text: rgba(255,255,255,0.9) (light)

                                                        Superset:
                                                        - Border: Gold (#FFD700)
                                                        - Background: rgba(255,215,0,0.05)

                                                        Dropset:
                                                        - Border: Blue (#60A5FA)
                                                        - Background: rgba(96,165,250,0.05)
                                                        ```

                                                        ### Hover/Active States
                                                        ```
                                                        Exercise card hover: bg-[rgba(255,255,255,0.05)]
                                                        Drag handle hover: cursor-grab
                                                        Drop zone active: border-2 border-[#FFD700]
                                                        Button hover: opacity-80
                                                        ```

                                                        ---

                                                        ## Drag-and-Drop Specifications

                                                        ### DND Kit Integration
                                                        ```
                                                        - Use existing @dnd-kit/core setup
                                                        - Left panel: draggable items (exercises)
                                                        - Right panel: droppable area + sortable items
                                                        - Visual feedback on drag over
                                                        ```

                                                        ### Drop Zones
                                                        1. **Right panel empty state** - "Drag exercises here"
                                                        2. 2. **Between exercises** - Visual insertion line
                                                           3. 3. **After last exercise** - Drop at end
                                                             
                                                              4. ---
                                                             
                                                              5. ## Data Persistence
                                                             
                                                              6. ### Auto-Save (useAutoSave Hook)
                                                              7. ```
                                                                 - Trigger: Every 30 seconds if changes
                                                                 - Debounce: 300ms on each change
                                                                 - Show: "Saving..." then "Last saved X mins ago"
                                                                 ```

                                                                 ### LocalStorage
                                                                 ```
                                                                 - Key: 'recentExercises'
                                                                 - Value: Array<Exercise> (max 10 items)
                                                                 - Persist: On each exercise selection
                                                                 ```

                                                                 ---

                                                                 ## Responsive Behavior

                                                                 ### Desktop (1200px+)
                                                                 - Dual-panel side-by-side
                                                                 - - Left: 350px fixed
                                                                   - - Right: flex-1
                                                                    
                                                                     - ### Tablet (768px-1199px)
                                                                     - - Stack vertically
                                                                       - - Left: full width, 50vh
                                                                         - - Right: full width, 50vh
                                                                           - - Or: Tab switch between panels
                                                                            
                                                                             - ### Mobile (< 768px)
                                                                             - - Full-width single panel
                                                                               - - Tab buttons to switch: "Library" | "Workout"
                                                                                
                                                                                 - ---

                                                                                 ## Component Files to Create

                                                                                 ```
                                                                                 components/workout-builder/
                                                                                 ├── DualPanelWorkoutBuilder.tsx         (NEW - Main container)
                                                                                 ├── ExerciseLibraryPanel.tsx            (NEW - Left sidebar)
                                                                                 ├── WorkoutPlanPanel.tsx                (NEW - Right panel)
                                                                                 ├── DropsetGroup.tsx                    (NEW - Dropset visualization)
                                                                                 ├── CreateSupersetDialog.tsx            (NEW - Superset creation)
                                                                                 ├── CreateDropsetDialog.tsx             (NEW - Dropset creation)
                                                                                 ├── hooks/
                                                                                 │   ├── useExerciseFilter.ts            (NEW)
                                                                                 │   ├── useDebounce.ts                  (NEW)
                                                                                 │   ├── useAutoSave.ts                  (NEW)
                                                                                 │   └── useWorkoutEstimate.ts           (NEW)
                                                                                 ├── DayBuilderStep.tsx                  (MODIFY - Use new component)
                                                                                 ├── SupersetGroup.tsx                   (existing - enhance)
                                                                                 └── types.ts                            (MODIFY - Add new interfaces)
                                                                                 ```

                                                                                 ---

                                                                                 ## Integration Steps

                                                                                 1. Create all new components above
                                                                                 2. 2. Modify DayBuilderStep to use DualPanelWorkoutBuilder
                                                                                    3. 3. Enhance SupersetGroup if needed
                                                                                       4. 4. Test drag-and-drop thoroughly
                                                                                          5. 5. Test responsive layout
                                                                                             6. 6. Verify auto-save works
                                                                                                7. 7. Check TypeScript types
                                                                                                  
                                                                                                   8. ---
                                                                                                  
                                                                                                   9. ## Testing Requirements
                                                                                                  
                                                                                                   10. - [ ] Left panel filters work (search, muscle groups, equipment)
                                                                                                       - [ ] - [ ] Drag from left to right adds exercise
                                                                                                       - [ ] - [ ] Can select multiple exercises for superset/dropset
                                                                                                       - [ ] - [ ] Superset groups display correctly (gold border)
                                                                                                       - [ ] - [ ] Dropset groups display correctly (blue border, weights)
                                                                                                       - [ ] - [ ] Reordering within right panel works
                                                                                                       - [ ] - [ ] Auto-save triggers every 30s
                                                                                                       - [ ] - [ ] Recently used persists after refresh
                                                                                                       - [ ] - [ ] Responsive on tablet (stacked)
                                                                                                       - [ ] - [ ] Responsive on mobile (tabs)
                                                                                                       - [ ] - [ ] No console errors
                                                                                                       - [ ] - [ ] All TypeScript types correct
                                                                                                      
                                                                                                       - [ ] ---
                                                                                                      
                                                                                                       - [ ] This is the MISSING specification for the dual-panel layout. Use this along with:
                                                                                                       - [ ] - EXERCISE_LIBRARY_FILTERING.md (filtering logic)
                                                                                                       - [ ] - QUICK_START_IMPLEMENTATION.md (code snippets)
                                                                                                       - [ ] - WORKOUT_BUILDER_IMPROVEMENTS.md (overall strategy)
