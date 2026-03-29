# Practices data schema

This directory contains one file-per-practice as JSON. Use the `index.js` data file to get a normalized array of practices for templates.

Schema fields
- `id` (string, required): unique id, e.g. "centered-prayer"
- `slug` (string, required): path-friendly slug
- `title` (string, required)
- `description` (string)
- `steps` (array of strings)
- `mainThree` (string or array): one or more of `pray`, `read`, `gather` (case-insensitive). `index.js` will normalize to the canonical names from `src/_data/mainThree.json`.
- `durationMinutes` (number)
- `materials` (array of strings)
- `difficulty` (string: "easy" | "medium" | "hard")
- `image` (string): site-relative path to image
- `tags` (array of strings)
- `video` (string): a YouTube URL or embed link
- `related` (array of `id` strings)

Notes
- Prefer using `mainThree` as an array for flexibility, but a single string is supported.
- The `index.js` aggregator sorts practices alphabetically by `title` and will attempt to normalize `mainThree` case-insensitively to the three canonical names.
- Add additional fields as needed; keep them consistent across practices.