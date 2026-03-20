# Backend: Roadmap Limit Bug Fix

## 🐛 The Problem

The backend is incorrectly checking **roadmap limits** when creating **roadmap items**.

### Current (Wrong) Behavior:
```
User creates Roadmap Item → Backend returns ROADMAP_LIMIT_REACHED → Error ❌
```

### Expected (Correct) Behavior:
```
User creates Roadmap Item → Backend creates it successfully → Success ✅
User creates Roadmap → Backend checks limit → Shows upgrade if limit reached ✅
```

---

## 📊 What Should Be Limited vs Not Limited

| Action | Should Check Limit? | Why? |
|--------|-------------------|------|
| **Create Roadmap Item** | ❌ NO | Items are content within roadmaps, users should be able to add unlimited items |
| **Create Roadmap** | ✅ YES | Roadmaps are containers, limit based on plan (e.g., Free: 1, Starter: 3) |

---

## 🔍 What to Look For in Backend

### Find the roadmap item creation endpoint:
```
POST /api/boards/:boardSlug/roadmap
```
or
```
POST /api/roadmap/items
```

### Look for this kind of code (INCORRECT):
```javascript
// ❌ WRONG - Don't check roadmap limit when creating items
async function createRoadmapItem(req, res) {
  // Check if organization has reached roadmap limit
  const roadmapLimit = await checkRoadmapLimit(organizationId);
  if (roadmapLimit.reached) {
    return res.status(403).json({
      error: 'ROADMAP_LIMIT_REACHED',
      message: 'You have reached the roadmap limit'
    });
  }
  
  // Create roadmap item...
}
```

### Should be (CORRECT):
```javascript
// ✅ CORRECT - No limit check for items
async function createRoadmapItem(req, res) {
  // Just create the item, no limit check needed
  const item = await RoadmapItem.create({...});
  return res.json({ success: true, data: { item } });
}
```

---

## 🔧 Backend Fix Required

### For Creating Roadmap ITEMS:
**Remove the limit check completely** from these endpoints:
- `POST /api/boards/:boardSlug/roadmap` (create roadmap item)
- `POST /api/roadmap/items` (create roadmap item)
- Any endpoint that creates individual roadmap items

### For Creating ROADMAPS (containers):
**Keep the limit check** on these endpoints:
- `POST /api/roadmaps` (create new roadmap container)

---

## 📝 Example Backend Implementation

### ✅ Roadmap Item Creation (NO LIMIT CHECK)
```javascript
// POST /api/boards/:boardSlug/roadmap
router.post('/boards/:boardSlug/roadmap', async (req, res) => {
  try {
    const { boardSlug } = req.params;
    const { title, description, status, priority, is_public, ...data } = req.body;
    
    // Find board
    const board = await Board.findOne({ slug: boardSlug });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    // Create roadmap item (NO LIMIT CHECK)
    const item = await RoadmapItem.create({
      title,
      description,
      status,
      priority,
      is_public,
      board_id: board.id,
      organization_id: req.user.organization_id,
      created_by: req.user.id,
      ...data
    });
    
    return res.status(201).json({
      success: true,
      data: { item }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### ✅ Roadmap Creation (WITH LIMIT CHECK)
```javascript
// POST /api/roadmaps
router.post('/roadmaps', async (req, res) => {
  try {
    const { name, description } = req.body;
    const organizationId = req.user.organization_id;
    
    // ✅ CHECK LIMIT ONLY HERE (when creating roadmap containers)
    const plan = await getOrganizationPlan(organizationId);
    const currentRoadmapCount = await Roadmap.count({
      where: { organization_id: organizationId }
    });
    
    if (currentRoadmapCount >= plan.roadmap_limit) {
      return res.status(403).json({
        error: 'ROADMAP_LIMIT_REACHED',
        message: `You have reached the roadmap limit for ${plan.name} plan (${plan.roadmap_limit} roadmaps)`
      });
    }
    
    // Create roadmap
    const roadmap = await Roadmap.create({
      name,
      description,
      organization_id: organizationId,
      created_by: req.user.id,
    });
    
    return res.status(201).json({
      success: true,
      data: { roadmap }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

---

## 🎯 Plan Limits Example

| Plan | Roadmap Containers | Roadmap Items per Roadmap |
|------|-------------------|---------------------------|
| Free | 1 | Unlimited ♾️ |
| Starter | 3 | Unlimited ♾️ |
| Pro | 10 | Unlimited ♾️ |
| Enterprise | Unlimited | Unlimited ♾️ |

**Key Point:** Users should be able to add unlimited items to their roadmaps, regardless of plan.

---

## 🧪 Testing

### Test 1: Create Roadmap Item (Should Work)
```bash
POST /api/boards/feature-requests/roadmap
{
  "title": "Dark Mode",
  "description": "Add dark theme",
  "status": "planned",
  "priority": "high",
  "is_public": true
}

# Expected: 201 Created ✅
# Should NOT return ROADMAP_LIMIT_REACHED
```

### Test 2: Create Multiple Roadmap Items (Should Work)
```bash
# Create 10 roadmap items in a row
# Expected: All succeed ✅
```

### Test 3: Create Roadmap Container (Should Check Limit)
```bash
POST /api/roadmaps
{
  "name": "Q1 2026 Roadmap",
  "description": "First quarter roadmap"
}

# If on Free plan and already have 1 roadmap:
# Expected: 403 ROADMAP_LIMIT_REACHED ✅
```

---

## 📋 Backend Checklist

- [ ] Find roadmap item creation endpoint(s)
- [ ] Remove `ROADMAP_LIMIT_REACHED` check from item creation
- [ ] Verify roadmap container creation still has limit check
- [ ] Test creating multiple roadmap items (should all succeed)
- [ ] Test creating multiple roadmaps (should fail at limit)
- [ ] Update API documentation if needed

---

## 🔗 Related Files

**Frontend (Already Fixed):**
- `src/app/admin/roadmap/page.tsx` - Removed incorrect limit handling for items
- Upgrade dialog now shows correct message for items vs roadmaps

**Backend (Needs Fix):**
- Find the endpoint that handles `POST /api/boards/:boardSlug/roadmap` or similar
- Remove limit check from that endpoint
- Keep limit check only in `POST /api/roadmaps`

---

## 💡 Summary

**The Fix:**
1. ❌ Remove `ROADMAP_LIMIT_REACHED` check from roadmap **ITEM** creation
2. ✅ Keep `ROADMAP_LIMIT_REACHED` check for roadmap **CONTAINER** creation
3. 🎯 Users can create unlimited items, but limited containers based on plan

**Why:**
- **Roadmap** = Container (like a folder) - Limited by plan
- **Roadmap Item** = Content (like files in folder) - Should be unlimited

This matches how Canny and similar tools work - you pay for the infrastructure (roadmaps), but can add unlimited content (items) within them.
