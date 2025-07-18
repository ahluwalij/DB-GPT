# Unified Resource Selector

This document explains how to use the unified resource selector that shows both databases and knowledge spaces in a single popover.

## Overview

The Resource component has been enhanced to support showing all available resources (databases and knowledge spaces) in a unified view, regardless of the current chat scene.

## API Changes

### Backend

A new endpoint has been added:

```
POST /api/v1/chat/resources/all
```

This endpoint returns:
```json
{
  "databases": [
    {"param": "db_name", "type": "db_type"},
    ...
  ],
  "knowledge_spaces": [
    {"param": "space_name", "type": "space", "space_id": 123},
    ...
  ]
}
```

### Frontend

New API function in `web/client/api/request.ts`:
```typescript
export const getAllResources = () => {
  return POST<null, { databases: IDB[]; knowledge_spaces: IDB[] }>('/api/v1/chat/resources/all');
};
```

## Usage

### Basic Usage

To enable the unified resource selector, pass the `showAllResources` prop:

```tsx
<Resource
  fileList={fileList}
  setFileList={setFileList}
  setLoading={setLoading}
  fileName=""
  showAllResources={true}
/>
```

### Automatic Unified View

The unified view is automatically enabled when:

1. The `showAllResources` prop is set to `true`
2. The scene is `chat_unified`
3. The resource value is `all`
4. Both database and knowledge resources are needed (when both `isDataBase` and `isKnowledge` are true)

### UI Features

When in unified view:
- Resources are displayed in categorized sections (Databases and Knowledge Spaces)
- Each resource type has its own icon (Database icon for databases, Book icon for knowledge spaces)
- Radio button selection maintains consistency
- "None" option is available to clear selection
- The header shows "All Resources" instead of specific resource type

## Implementation Details

### State Management

The component maintains additional state for unified view:
```typescript
const [allResources, setAllResources] = useState<{ databases: IDB[]; knowledge_spaces: IDB[] } | null>(null);
const [showUnifiedView, setShowUnifiedView] = useState(false);
```

### Fetching Logic

When `showUnifiedView` is true, the component fetches from the new endpoint:
```typescript
if (showUnifiedView) {
  const [, res] = await apiInterceptors(getAllResources());
  if (res) {
    setAllResources(res);
    const combined = [
      ...(res.databases || []),
      ...(res.knowledge_spaces || [])
    ];
    setDbs(combined);
  }
}
```

### Display Logic

The popover content dynamically renders based on whether unified view is active:
- In unified view: Shows categorized sections with appropriate icons
- In normal view: Shows the original single list display

## Migration Guide

To migrate existing code to use the unified selector:

1. Add the `showAllResources` prop to your Resource component usage
2. The component will automatically handle fetching and displaying both resource types
3. The selected value format remains the same (resource name/param)

## Example

See `/web/components/examples/UnifiedResourceExample.tsx` for a complete working example.