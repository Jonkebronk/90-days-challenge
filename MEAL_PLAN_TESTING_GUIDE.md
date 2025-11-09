# Meal Plan Template System - Testing Guide

## Overview
This guide walks you through testing the complete meal plan template system with meal alternatives, from creation to client selection.

## Database State
- **Meal Plan Templates**: 0 (will create)
- **Clients Available**: 2
  - Monkey News (123@gmail.com)
  - Johnny Strand (jonkebronk@gmail.com)
- **Published Recipes**: 0 (will use custom meal options for testing)

## Testing Workflow

### Phase 1: Create Meal Plan Template (Coach View)

#### 1.1 Navigate to Meal Plans
1. Start dev server: `npm run dev`
2. Login as coach (johnnystrandkonsult@gmail.com)
3. Navigate to: **Innehåll > Måltidsplaner**
4. URL: `/dashboard/content/meal-plans`

**Expected**:
- Empty state with "Inga måltidsplaner än"
- "Skapa ny måltidsplan" button visible

#### 1.2 Create New Template
1. Click "Skapa ny måltidsplan"
2. Fill in form:
   - **Namn**: "Standard 90-Dagarsplan"
   - **Beskrivning**: "Balanserad måltidsplan för viktminskning"
   - **Mål Protein**: 150
   - **Mål Fett**: 60
   - **Mål Kolhydrater**: 180
   - **Mål Kalorier**: 1800
3. Click "Skapa mall"

**Expected**:
- Success toast: "Måltidsplan skapad"
- Redirected to template builder page
- URL: `/dashboard/content/meal-plans/[templateId]`

---

### Phase 2: Build Template with Meals and Options (Coach View)

#### 2.1 Add First Meal (Breakfast)
1. In "Lägg till måltid" section, fill form:
   - **Måltidsnamn**: "Frukost"
   - **Måltidstyp**: "Frukost"
   - **Target calories**: 450
2. Click "Lägg till måltid"

**Expected**:
- Success toast: "Måltid tillagd"
- New meal card appears in "Måltider i denna plan"
- Shows "Lägg till första alternativet" button

#### 2.2 Add First Meal Option (Custom Option)
1. Click "Lägg till alternativ" on Frukost meal
2. Dialog opens with two tabs: "Recept" and "Anpassad mat"
3. Click **"Anpassad mat"** tab
4. Fill in form:
   - **Namn**: "Havregrynsgröt med bär"
   - **Beskrivning**: "100g havregryn, 300ml mjölk, 100g blåbär, 1 msk honung"
   - **Kalorier**: 450
   - **Protein**: 18
   - **Fett**: 12
   - **Kolhydrater**: 70
   - Check **"Markera som standardalternativ"**
5. Click "Lägg till"

**Expected**:
- Success toast: "Alternativ tillagt"
- Dialog closes
- Meal card now shows 1 option
- Gold star (⭐) indicates default option

#### 2.3 Add Second Meal Option (Alternative)
1. Click "Lägg till alternativ" again on Frukost
2. Go to **"Anpassad mat"** tab
3. Fill in:
   - **Namn**: "Proteinpannkakor med sylt"
   - **Beskrivning**: "3 ägg, 50g havregryn, 200ml mjölk, jordgubbssylt"
   - **Kalorier**: 430
   - **Protein**: 25
   - **Fett**: 15
   - **Kolhydrater**: 45
   - **Notes**: "Högre protein, lägre kolhydrater"
   - Leave "standardalternativ" unchecked
4. Click "Lägg till"

**Expected**:
- Second option appears in Frukost meal card
- First option still has gold star
- Both options show macro breakdown

#### 2.4 Add Lunch Meal with Options
1. Add new meal:
   - **Måltidsnamn**: "Lunch"
   - **Måltidstyp**: "Lunch"
   - **Target calories**: 550
2. Add first lunch option (default):
   - **Namn**: "Kycklingfilé med ris och grönsaker"
   - **Kalorier**: 550
   - **Protein**: 45
   - **Fett**: 15
   - **Kolhydrater**: 55
   - Mark as default
3. Add second lunch option:
   - **Namn**: "Laxfilé med sötpotatis"
   - **Kalorier**: 530
   - **Protein**: 40
   - **Fett**: 20
   - **Kolhydrater**: 48

#### 2.5 Add Dinner Meal with Options
1. Add new meal:
   - **Måltidsnamn**: "Middag"
   - **Måltidstyp**: "Middag"
   - **Target calories**: 600
2. Add first dinner option (default):
   - **Namn**: "Köttfärssås med fullkornspasta"
   - **Kalorier**: 600
   - **Protein**: 42
   - **Fett**: 20
   - **Kolhydrater**: 65
   - Mark as default
3. Add second dinner option:
   - **Namn**: "Grillad biff med rostad potatis"
   - **Kalorier**: 620
   - **Protein**: 48
   - **Fett**: 22
   - **Kolhydrater**: 60

#### 2.6 Add Snack Meal
1. Add new meal:
   - **Måltidsnamn**: "Mellanmål"
   - **Måltidstyp**: "Mellanmål"
2. Add options:
   - Option 1: "Proteinshake" - 200 kcal, 25g protein (default)
   - Option 2: "Kvarg med nötter" - 220 kcal, 22g protein
   - Option 3: "Frukt och mandlar" - 180 kcal, 6g protein

#### 2.7 Save Template
1. Verify all meals appear correctly
2. Click "Spara ändringar" button

**Expected**:
- Success toast: "Måltidsplan uppdaterad"
- All changes saved to database

---

### Phase 3: Publish and Assign Template (Coach View)

#### 3.1 Publish Template
1. Go back to meal plans list: `/dashboard/content/meal-plans`
2. Find "Standard 90-Dagarsplan" template
3. Click "Publicera" button

**Expected**:
- Template published status changes
- Badge shows "Publicerad"

#### 3.2 Assign to Clients
1. On the same template, click "Tilldela" button
2. Assignment dialog opens
3. Search functionality:
   - Type "Monkey" in search box
   - Should filter to show only Monkey News
4. Select both clients:
   - Click on Monkey News row (should highlight gold)
   - Click on Johnny Strand row (should highlight gold)
   - Check box should show checkmark
5. Verify selection count shows "2 klienter valda"
6. Click "Tilldela till 2 klienter" button

**Expected**:
- Success toast: "Måltidsplan tilldelad till 2 klienter"
- Dialog closes
- Template card now shows "2" in assignment badge

---

### Phase 4: Client View and Selection (Client View)

#### 4.1 Login as Client
1. Logout from coach account
2. Login as: **123@gmail.com** (Monkey News)
3. Navigate to: **Måltidsplan > Visa mall** or direct URL: `/dashboard/meal-plan/template-view`

**Expected**:
- Page shows "Standard 90-Dagarsplan" template
- Macro summary card at top shows:
  - **Aktuellt**: Calculated based on default options
  - **Mål**: Target macros (1800 kcal, 150P, 60F, 180C)
- Four meal cards: Frukost, Lunch, Middag, Mellanmål

#### 4.2 View Meal Alternatives
1. **Frukost meal card** should show:
   - "Havregrynsgröt med bär" as selected (default)
   - "Rekommenderat" badge visible
   - Macro breakdown visible
2. Click on Frukost card header
3. Card expands to show all options:
   - Radio button group with 2 options
   - "Havregrynsgröt med bär" selected
   - "Proteinpannkakor med sylt" unselected

#### 4.3 Change Meal Selection
1. In expanded Frukost card, click radio button for "Proteinpannkakor med sylt"
2. Wait for auto-save

**Expected**:
- "Sparar..." text appears briefly
- Success toast: "Val sparat"
- Macro summary card updates immediately:
  - Protein increases (25g vs 18g)
  - Fat increases (15g vs 12g)
  - Carbs decrease (45g vs 70g)
  - Calories decrease slightly (430 vs 450)

#### 4.4 Test Multiple Selections
1. Expand **Lunch** meal
2. Try both options:
   - Select "Laxfilé med sötpotatis" (was "Kycklingfilé med ris")
   - Watch macro summary update
3. Expand **Mellanmål** meal (3 options)
4. Select "Frukt och mandlar"
5. Verify macro summary reflects all changes

**Expected**:
- Each selection auto-saves individually
- Macro summary recalculates in real-time
- No page refresh needed
- Selections persist on page reload

#### 4.5 Test Persistence
1. Close expanded meals (click header again)
2. Refresh page (F5)
3. Verify:
   - Selected options still showing as selected
   - Macro summary matches previous state
   - Default recommendations still visible for unselected meals

---

### Phase 5: Test as Second Client

#### 5.1 Login as Second Client
1. Logout
2. Login as: **jonkebronk@gmail.com** (Johnny Strand)
3. Navigate to: `/dashboard/meal-plan/template-view`

**Expected**:
- Same template visible
- Default options selected (NOT the choices made by Monkey News)
- Each client has independent selections

#### 5.2 Make Different Selections
1. Keep all default options for Johnny
2. Only change Lunch to "Laxfilé med sötpotatis"
3. Verify macro summary updates

#### 5.3 Cross-Verify Independence
1. Login back as Monkey News (123@gmail.com)
2. Check selections are still as chosen in Phase 4.4
3. Confirms client selections are independent

---

### Phase 6: Coach Review (Coach View)

#### 6.1 View Assignments
1. Login as coach
2. Go to `/dashboard/content/meal-plans`
3. Click on "Standard 90-Dagarsplan" row to edit
4. Click "Tilldela klienter" button

**Expected**:
- Dialog shows both clients
- Both have "Redan tilldelad" badge (green)
- Both are pre-selected (checked)

#### 6.2 Test Unassignment
1. In assignment dialog, uncheck Monkey News
2. Click "Tilldela till 1 klient"

**Expected**:
- Success toast
- Only Johnny Strand remains assigned
- Monkey News loses access to template

#### 6.3 Verify Client Access Removed
1. Login as Monkey News (123@gmail.com)
2. Go to `/dashboard/meal-plan/template-view`

**Expected**:
- Empty state: "Du har inga tilldelade måltidsplaner än"
- Template no longer visible

---

## Test Scenarios Summary

### ✅ Must Pass Tests
1. **Create template** with metadata and target macros
2. **Add meals** with different meal types
3. **Add multiple options** per meal (minimum 2, test 3 for snack)
4. **Set default option** (gold star appears)
5. **Publish template** (status changes)
6. **Assign to multiple clients** (batch assignment)
7. **Client can view** assigned template
8. **Client can expand** meal cards to see alternatives
9. **Client can select** alternative options
10. **Auto-save** works for selections
11. **Macro calculation** updates in real-time
12. **Selection persistence** across page refreshes
13. **Independent selections** per client
14. **Unassignment** removes client access

### 🧪 Edge Cases to Test
1. **No options** - Try viewing meal with 0 options (shouldn't happen, but graceful error)
2. **All same calories** - Do macros still calculate correctly?
3. **Very long names** - Does UI handle "Kycklingfilé med quinoa och rostade grönsaker i srirachasås"?
4. **Search with no results** - Type "xyz" in client search
5. **Rapid selection changes** - Click multiple options quickly
6. **Multiple templates** - Assign 2 different templates to same client

### 🐛 Known Limitations
1. **Recipe options** not tested (no recipes in DB) - use custom options only
2. **Edit/Delete options** UI exists but handlers not implemented
3. **Delete meal** requires confirmation but doesn't re-order remaining meals
4. **Serving multiplier** from recipe dialog not tested

---

## Success Criteria

The meal plan template system is working correctly if:

1. ✅ Coach can create templates with target macros
2. ✅ Coach can add unlimited meals and options
3. ✅ Coach can mark default recommendations
4. ✅ Coach can assign templates to multiple clients
5. ✅ Clients see only their assigned templates
6. ✅ Clients can select preferred alternatives
7. ✅ Selections auto-save without page refresh
8. ✅ Macro totals calculate correctly based on selections
9. ✅ Each client has independent selections
10. ✅ UI is consistent with platform design (gold/dark theme)

---

## Troubleshooting

### Issue: Template not appearing for client
**Check**:
1. Template is published (not draft)
2. Client is assigned to template
3. Assignment is active (not deleted)
4. Client is logged in with correct account

### Issue: Macros not updating
**Check**:
1. All options have calculatedProtein/Fat/Carbs/Calories values
2. Default option exists for each meal
3. Client selections are saving (check Network tab)

### Issue: Selection not persisting
**Check**:
1. API endpoint `/api/client-meal-selection` returning 200
2. Database has ClientMealSelection records
3. Page is fetching selections on load

### Issue: Can't assign to client
**Check**:
1. User has role='client'
2. Client appears in `/api/clients` response
3. Template ID is valid

---

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/meal-plan-templates` | POST | Create template |
| `/api/meal-plan-templates/[id]` | GET/PATCH | Get/update template |
| `/api/meal-plan-templates/[id]/meals` | POST | Add meal |
| `/api/meal-plan-templates/[id]/meals/[mealId]` | PATCH/DELETE | Update/delete meal |
| `/api/meal-plan-templates/[id]/meals/[mealId]/options` | POST | Add option |
| `/api/meal-plan-templates/[id]/meals/[mealId]/options/[optionId]` | PATCH/DELETE | Update/delete option |
| `/api/meal-plan-templates/[id]/assign` | POST | Assign to clients |
| `/api/my-meal-plan-templates` | GET | Get client's templates |
| `/api/client-meal-selection` | POST | Save client selection |

---

## Next Steps After Testing

If all tests pass:
1. Consider adding edit/delete option handlers
2. Add support for recipe-based options (when recipes exist)
3. Consider adding meal re-ordering (drag-drop)
4. Add option re-ordering within meals
5. Consider adding print/export functionality
6. Add client progress tracking (adherence %)
7. Consider adding coach view of client selections

---

## Test Execution Log

Use this section to log your test results:

**Date**: ___________
**Tester**: ___________

| Test Phase | Status | Notes |
|------------|--------|-------|
| Phase 1: Create Template | ⬜ | |
| Phase 2: Build Template | ⬜ | |
| Phase 3: Publish & Assign | ⬜ | |
| Phase 4: Client View | ⬜ | |
| Phase 5: Second Client | ⬜ | |
| Phase 6: Coach Review | ⬜ | |

**Bugs Found**:

**Feature Requests**:

**Overall Assessment**:
