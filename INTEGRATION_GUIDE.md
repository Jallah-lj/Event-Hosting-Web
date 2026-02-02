// INTEGRATION INSTRUCTIONS
// Follow these steps to integrate the refactored organizer dashboard

## STEP-BY-STEP INTEGRATION

### Step 1: Backup Original Files
```bash
# Create backup directory
mkdir -p backup/organizer_old
cp views/OrganizerPanel.tsx backup/organizer_old/
cp client/src/pages/organizer/Dashboard.tsx backup/organizer_old/
```

### Step 2: Create Required Directory Structure
```bash
# Ensure these directories exist
mkdir -p client/src/components/organizer
mkdir -p client/src/utils
mkdir -p client/src/hooks
```

### Step 3: Add Type Definitions (if not exists)
Ensure your types.ts includes these interfaces:
```typescript
export interface Event {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  date: string;
  endDate: string;
  location: string;
  category: string;
  capacity: number;
  price: number;
  imageUrl?: string;
  status: 'PENDING' | 'DRAFT' | 'APPROVED' | 'REJECTED';
  ticketTiers: TicketTier[];
  attendeeCount: number;
}

export interface Ticket {
  id: string;
  eventId: string;
  attendeeName: string;
  attendeeEmail: string;
  tierName: string;
  pricePaid: number;
  used: boolean;
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  allocation: number;
}

export type ViewState = 'ORGANIZER_PANEL' | 'ORGANIZER_CREATE' | 'ORGANIZER_ATTENDEES';
```

### Step 4: Update App.tsx Imports
```typescript
// OLD
import { OrganizerPanel } from './views/OrganizerPanel';

// NEW
import { OrganizerPanel } from './views/OrganizerPanel_REFACTORED';
```

### Step 5: Update Component Imports in OrganizerPanel_REFACTORED
Make sure all relative paths are correct:
```typescript
import EventForm from '../components/organizer/EventForm';
import OrganizerDashboardOverview from '../components/organizer/OrganizerDashboardOverview';
import { useOrganizerDashboardState } from '../hooks/useOrganizerDashboardState';
import { useToast } from '../components/Toast';
import { Button } from '../components/Button';
```

### Step 6: Update Service Layer Usage
In EventForm.tsx, ensure services are correctly imported:
```typescript
import { generateEventDescription, generateEventImage } from '../../services/geminiService';
import { validateEventForm } from '../../utils/validation';
```

### Step 7: Test Each Component Independently

**Test EventForm.tsx:**
```typescript
import EventForm from './EventForm';

function TestEventForm() {
  const handleSubmit = async (data) => {
    console.log('Event data:', data);
  };
  
  return (
    <EventForm
      onSubmit={handleSubmit}
      onCancel={() => {}}
    />
  );
}
```

**Test OrganizerDashboardOverview.tsx:**
```typescript
import OrganizerDashboardOverview from './OrganizerDashboardOverview';

function TestOverview() {
  const mockEvents = [/* your test events */];
  const mockTickets = [/* your test tickets */];
  
  return (
    <OrganizerDashboardOverview 
      events={mockEvents}
      tickets={mockTickets}
      currency="USD"
    />
  );
}
```

**Test useOrganizerDashboardState:**
```typescript
function TestHook() {
  const state = useOrganizerDashboardState();
  
  // Test state changes
  state.setCurrentView('CREATE');
  state.addFormError('title', 'Title is required');
  
  return <div>Logs: {JSON.stringify(state.currentView)}</div>;
}
```

### Step 8: Handle API Calls
Update the onCreateEvent, onUpdateEvent handlers in your parent component:

```typescript
const handleCreateEvent = async (eventData) => {
  try {
    const response = await eventsService.create({
      ...eventData,
      organizerId: user.id,
    });
    setEvents([...events, response]);
    addToast('Event created', 'success');
  } catch (error) {
    addToast('Failed to create event', 'error');
  }
};

const handleUpdateEvent = async (eventData) => {
  try {
    const response = await eventsService.update(eventData.id, eventData);
    setEvents(events.map(e => e.id === eventData.id ? response : e));
    addToast('Event updated', 'success');
  } catch (error) {
    addToast('Failed to update event', 'error');
  }
};
```

### Step 9: Environment Variables
Ensure these are set in your .env files:
```env
VITE_API_URL=http://localhost:3000
VITE_GEMINI_API_KEY=your_gemini_key
```

### Step 10: Run Tests
```bash
npm test -- organizer

# Or specific component
npm test -- EventForm
npm test -- OrganizerDashboardOverview
npm test -- useOrganizerDashboardState
```

### Step 11: Build and Deploy
```bash
# Build
npm run build

# Check bundle size
npm run build -- --report

# Test locally
npm run preview
```

## TROUBLESHOOTING

### Issue: "Cannot find module 'components/organizer/EventForm'"
**Solution:** Check directory structure matches paths in imports

### Issue: "ValidationError interface not found"
**Solution:** Make sure validation.ts is in client/src/utils/

### Issue: "useOrganizerDashboardState not found"
**Solution:** Check hooks directory exists and has useOrganizerDashboardState.ts

### Issue: "Toast component not found"
**Solution:** Ensure Button.tsx and Toast.tsx exist and are importable

### Issue: "generateEventDescription is undefined"
**Solution:** Check geminiService.ts exists and exports these functions

### Issue: Dark mode not working
**Solution:** Verify Tailwind dark: prefix is enabled in tailwind.config.js

## VALIDATION CHECKLIST

Before going to production:

□ All imports resolve correctly
□ No TypeScript errors
□ Event creation form works
□ Event editing works
□ Event deletion with confirmation works
□ Form validation catches errors
□ AI generation works (if API keys set)
□ Toast notifications display
□ Loading states appear
□ Error messages show properly
□ Data exports correctly
□ Responsive design works on mobile
□ Dark mode works
□ Accessibility features work
□ All tabs navigate correctly
□ Performance acceptable

## PERFORMANCE MONITORING

Monitor these metrics after deployment:

```typescript
// In your analytics service
trackOrganizerDashboard({
  eventsFetched: events.length,
  ticketsFetched: tickets.length,
  loadTime: performance.now(),
  componentRenderTime: measureComponentRender(),
});
```

## ROLLBACK PLAN

If issues arise:

```bash
# Revert to old version
cp backup/organizer_old/OrganizerPanel.tsx views/
git checkout client/src/pages/organizer/Dashboard.tsx

# Remove new files
rm client/src/components/organizer/EventForm.tsx
rm client/src/components/organizer/OrganizerDashboardOverview.tsx
rm client/src/utils/validation.ts
rm client/src/hooks/useOrganizerDashboardState.ts

# Restart services
npm run dev
```

## NEXT STEPS

After successful integration:

1. **Implement remaining sections:**
   - Attendees management
   - Marketing tools
   - Broadcasting system
   - Finance dashboard

2. **Add advanced features:**
   - Real-time updates with WebSockets
   - Advanced analytics
   - Team collaboration
   - Template management

3. **Performance optimization:**
   - Code splitting
   - Lazy loading
   - Caching strategies
   - Image optimization

4. **Testing:**
   - Unit tests for components
   - Integration tests
   - E2E tests
   - Performance tests

---
Version: 1.0
Last Updated: 2024-02-02
