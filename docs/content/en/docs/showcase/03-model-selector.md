# Model Selector Redesign

![Model Selector Redesign](/showcase/hero-03-model-selector.avif)

The Model Selector is night-and-day different from upstream. Upstream had no search at all — you scrolled through an unsorted list. This fork adds full-text search across model titles, filenames, tags, and groups. You can filter by model type (VRM, Live2D, MMD, Spine) and by tag groups. The local WD14 tagger integrates directly into the selector so you can scout your entire collection and decorate every model with searchable metadata.

Two layout modes give you the upstream classic 2-column view for familiarity, plus a dense 4-column layout for efficiently browsing large collections. Batch VRM import lets you select and import multiple models at once directly from the selector dialog. The legacy avatar select dropdown has been replaced with the modern `ModelSelectorDialog` card trigger, and reactive model favorites make frequently-used models instantly accessible.

Tag search extends everywhere — the CardImportWizard, Concept Builder manifestation tab, and Control Strip avatar popover all share the same indexed tag system.

## Key Capabilities

- Full-text search across titles, filenames, tags, and groups
- Filter by model type (VRM, Live2D, MMD, Spine) and tag groups
- WD14 tagger integration — tag models directly from the selector
- 2-column classic layout plus dense 4-column layout
- Batch VRM import — select and import multiple models at once
- Reactive model favorites with quick popover access
- Tag search across CardImportWizard, Concept Builder, and Control Strip

> See the [full feature breakdown](/en/docs/chronicles/feature-report#23-model-selector--redesigned) in the Feature Report.
