# Starting local server

```
brew services start mongodb/brew/mongodb-community
```

## Model and Service Boundaries

- Models in express/src/models are CRUD-only and must not import other models.
- Services in express/src/services orchestrate multi-collection workflows using model functions only.
- Run the model import check with `npm run check:model-imports`.
