# Theme Preview Notes

## How to open the preview

- Start the app normally.
- Open `/?previewTheme=1` to load the prototype comparison page.
- Use the theme selector cards to switch between the three directions:
  - Trust Blue Pro
  - Aurora Glass
  - Warm Civic

## What is included

- Login/form preview
- Button variants
- Card styling block
- Table styling block
- Sidebar/navbar shell mock
- Dashboard metric cards
- Shared `DataTable` compatibility sample

## Accessibility + usability checks to use before final selection

- Contrast at minimum WCAG AA for body text and interactive controls.
- Focus visibility on buttons, links, and form fields in all states.
- Table readability for dense operational data.
- Dashboard scan speed for key metrics and urgent statuses.
- Resident readability on content-heavy pages (announcements/documents).

## Recommendation workflow after direction selection

1. Confirm selected direction and approve token naming.
2. Promote token set from `src/prototype/themeDirections.ts` into official design tokens.
3. Create shared primitives (`Button`, `Input`, `Card`, `Table`, `Badge`) using the selected tokens.
4. Migrate shell layouts (`admin`, `company`, `resident`) to tokenized styles.
5. Run accessibility pass + visual QA before full rollout.
