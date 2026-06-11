# Manual external AI test set

Put real outside-catalog test images into these folders:

- `ao/` for shirts, t-shirts, tops, hoodies
- `quan/` for pants, jeans, shorts, joggers

Recommended size: 25-50 images per folder.

Then run:

```powershell
.\.venv\Scripts\python.exe evaluation_api.py --generate-from-folder --limit 5
```

This creates `evaluation/external_queries.json` and evaluates type accuracy/no-result behavior.
