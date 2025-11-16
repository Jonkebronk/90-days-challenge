# Booking System Integration for Intresseanmälan

## Executive Summary

This document outlines the research and implementation plan for integrating a calendar booking system into the intresseanmälan (expression of interest) flow for Friskvårdskompassen.

**Recommendation:** Cal.com (free tier)
- Best Next.js integration
- Unlimited bookings on free plan
- Webhook support for automation
- GDPR compliant (European company)
- Can prefill user data from intresseanmälan
- Only limitation: No Swedish language (but most Swedes handle English well)

**Alternative:** YouCanBookMe (if Swedish language is critical)

---

## Tool Comparison

### 1. Cal.com ⭐ RECOMMENDED

**Pros:**
- ✅ FREE tier with unlimited bookings
- ✅ Best Next.js integration (React component)
- ✅ Webhook support for automation
- ✅ GDPR compliant (European company)
- ✅ Can prefill user data
- ✅ Open source (can self-host if needed)
- ✅ Custom branding on free tier
- ✅ Buffer times between meetings
- ✅ Round-robin for multiple team members

**Cons:**
- ❌ No Swedish language support
- ❌ Email customization limited on free tier

**Cost:**
- Free: $0/month (unlimited bookings, 1 event type)
- Essentials: $12/month (unlimited event types)
- Professional: $29/month (workflows, routing)

**3-Year Cost:** $0 (Free) | $432 (Essentials) | $1,044 (Professional)

**Integration Method:** Embedded iframe or React component

---

### 2. Calendly

**Pros:**
- ✅ Very popular and polished
- ✅ Good user experience
- ✅ Reliable service
- ✅ Zapier integration

**Cons:**
- ❌ Free tier very limited (1 event type only)
- ❌ No webhook on free tier
- ❌ Calendly branding on all tiers
- ❌ No Swedish language
- ❌ Expensive ($10-16/month minimum)

**Cost:**
- Free: $0/month (very limited)
- Essentials: $10/user/month
- Professional: $16/user/month

**3-Year Cost:** $360 (Essentials) | $576 (Professional)

---

### 3. TidyCal

**Pros:**
- ✅ One-time payment (lifetime access)
- ✅ Unlimited bookings
- ✅ Very affordable
- ✅ White-label option

**Cons:**
- ❌ No webhook support
- ❌ Limited integration options
- ❌ Smaller company (support concerns)
- ❌ No Swedish language

**Cost:**
- $29 one-time payment (lifetime)

**3-Year Cost:** $29 (one-time)

---

### 4. Acuity Scheduling (Squarespace)

**Pros:**
- ✅ Very professional
- ✅ Good for service businesses
- ✅ Payment integration
- ✅ Strong calendar sync

**Cons:**
- ❌ No free tier
- ❌ Expensive ($16-61/month)
- ❌ No Swedish language
- ❌ Overkill for simple booking needs

**Cost:**
- Emerging: $16/month
- Growing: $27/month
- Powerhouse: $61/month

**3-Year Cost:** $576 (Emerging) | $972 (Growing) | $2,196 (Powerhouse)

---

### 5. YouCanBookMe

**Pros:**
- ✅ Swedish language support (confirmed)
- ✅ Simple and clean interface
- ✅ Good customization
- ✅ Reasonable pricing

**Cons:**
- ❌ No free tier
- ❌ Limited integration options
- ❌ Less modern than Cal.com

**Cost:**
- Paid: $10/month (1 calendar)
- Team: $20/month (multiple calendars)

**3-Year Cost:** $360 (Paid) | $720 (Team)

---

## Recommended Implementation: Cal.com

### Phase 1: Basic Integration

1. **Create Cal.com Account**
   - Sign up at cal.com
   - Create event type: "Introduktionssamtal" (30 min)
   - Connect Google Calendar/Outlook
   - Set availability hours

2. **Update Intresseanmälan Success Page**

```tsx
// app/(auth)/apply/success/page.tsx
'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const name = searchParams.get('name') || ''
  const email = searchParams.get('email') || ''
  const service = searchParams.get('service') || ''

  useEffect(() => {
    // Load Cal.com embed script
    const script = document.createElement('script')
    script.src = 'https://app.cal.com/embed/embed.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="min-h-screen bg-dark-primary text-white py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="font-['Orbitron',sans-serif] text-4xl font-black mb-6">
            Tack för din intresseanmälan!
          </h1>
          <p className="text-gray-300 text-lg mb-4">
            Vi har tagit emot din intresseanmälan för <strong>{service}</strong>.
          </p>
          <p className="text-gray-400 mb-8">
            Nästa steg är att boka ett kostnadsfritt introduktionssamtal där vi går igenom
            dina mål och hur vi kan hjälpa dig.
          </p>
        </div>

        {/* Cal.com Embed */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Boka ditt introduktionssamtal
          </h2>
          <div
            data-cal-link="your-username/introduktionssamtal"
            data-cal-config={JSON.stringify({
              name: name,
              email: email,
              notes: `Service: ${service}`,
              theme: 'dark'
            })}
            style={{ width: '100%', height: '100%', overflow: 'scroll' }}
          />
        </div>

        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>Du kan också boka senare via länken som skickats till {email}</p>
        </div>
      </div>
    </div>
  )
}
```

3. **Update Form Submission to Redirect**

```tsx
// app/(auth)/apply/page.tsx

// In handleSubmit after successful submission:
router.push(
  `/apply/success?name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}&service=${encodeURIComponent(formData.serviceType)}`
)
```

4. **Create Success Page Route**
```bash
mkdir -p app/(auth)/apply/success
# Create page.tsx as shown above
```

---

### Phase 2: Webhook Automation

1. **Set Up Cal.com Webhook**
   - Go to Cal.com Settings → Webhooks
   - Create webhook: `https://yourdomain.com/api/webhooks/cal`
   - Select events: `BOOKING_CREATED`, `BOOKING_CANCELLED`, `BOOKING_RESCHEDULED`

2. **Create Webhook Handler**

```ts
// app/api/webhooks/cal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const { triggerEvent, payload: eventData } = payload

    switch (triggerEvent) {
      case 'BOOKING_CREATED':
        await handleBookingCreated(eventData)
        break
      case 'BOOKING_CANCELLED':
        await handleBookingCancelled(eventData)
        break
      case 'BOOKING_RESCHEDULED':
        await handleBookingRescheduled(eventData)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}

async function handleBookingCreated(data: any) {
  const { uid, title, startTime, endTime, attendees, responses } = data

  // Find the lead by email
  const lead = await prisma.lead.findFirst({
    where: { email: attendees[0].email }
  })

  if (lead) {
    // Update lead with booking info
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        bookingId: uid,
        bookingDate: new Date(startTime),
        status: 'MEETING_BOOKED', // Add this status to Prisma schema
        notes: `${lead.notes}\n\nMöte bokat: ${new Date(startTime).toLocaleString('sv-SE')}`
      }
    })

    // Optional: Send confirmation email
    // await sendBookingConfirmation(lead.email, startTime)
  }
}

async function handleBookingCancelled(data: any) {
  const { uid, attendees } = data

  const lead = await prisma.lead.findFirst({
    where: {
      email: attendees[0].email,
      bookingId: uid
    }
  })

  if (lead) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        bookingId: null,
        bookingDate: null,
        status: 'MEETING_CANCELLED',
        notes: `${lead.notes}\n\nMöte avbokat: ${new Date().toLocaleString('sv-SE')}`
      }
    })
  }
}

async function handleBookingRescheduled(data: any) {
  const { uid, startTime, attendees } = data

  const lead = await prisma.lead.findFirst({
    where: {
      email: attendees[0].email,
      bookingId: uid
    }
  })

  if (lead) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        bookingDate: new Date(startTime),
        notes: `${lead.notes}\n\nMöte ombookat till: ${new Date(startTime).toLocaleString('sv-SE')}`
      }
    })
  }
}
```

3. **Update Prisma Schema**

```prisma
// prisma/schema.prisma

model Lead {
  id                  String    @id @default(cuid())
  serviceType         String?   // Already added

  // Booking fields
  bookingId          String?   // Cal.com booking UID
  bookingDate        DateTime? // Scheduled meeting time

  // ... existing fields
  status             String    @default("NEW") // NEW, MEETING_BOOKED, MEETING_COMPLETED, MEETING_CANCELLED
}
```

4. **Run Migration**
```bash
npx prisma db push
```

---

### Phase 3: Admin Dashboard Updates

1. **Update Lead Card to Show Booking Status**

```tsx
// components/admin/LeadCard.tsx (or wherever leads are displayed)

<div className="flex items-center gap-2 mb-2">
  {lead.bookingDate && (
    <div className="flex items-center gap-1 text-sm text-green-400">
      <CalendarIcon className="w-4 h-4" />
      <span>
        Möte: {new Date(lead.bookingDate).toLocaleString('sv-SE', {
          dateStyle: 'short',
          timeStyle: 'short'
        })}
      </span>
    </div>
  )}

  {lead.status === 'MEETING_BOOKED' && (
    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
      Möte bokat
    </span>
  )}

  {lead.status === 'MEETING_CANCELLED' && (
    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
      Möte avbokat
    </span>
  )}
</div>
```

---

### Phase 4: Email Notifications

1. **Send Booking Link in Welcome Email**

Update the email sent after intresseanmälan to include Cal.com booking link:

```tsx
// lib/email.ts or wherever email logic is

const bookingLink = `https://cal.com/your-username/introduktionssamtal?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&notes=${encodeURIComponent(`Service: ${serviceType}`)}`

const emailContent = `
  Hej ${name}!

  Tack för din intresseanmälan för ${serviceType}!

  Nästa steg är att boka ett kostnadsfritt introduktionssamtal där vi går igenom
  dina mål och hur vi kan hjälpa dig.

  Boka ditt möte här:
  ${bookingLink}

  Vi ser fram emot att höra från dig!

  Med vänliga hälsningar,
  Friskvårdskompassen
`
```

---

## Swedish Language Solution (Workaround for Cal.com)

Since Cal.com doesn't have Swedish language support, here are workarounds:

### Option 1: Custom Event Type Names
- Name event type in Swedish: "Introduktionssamtal"
- Use Swedish in description field
- Users will see Swedish labels even if UI is English

### Option 2: Custom CSS Overlay
Cal.com allows custom CSS. Create Swedish translations:

```css
/* Custom CSS in Cal.com settings */
[data-testid="event-title"]::before {
  content: "Välj datum och tid" !important;
}

button[data-testid="confirm-button"]::before {
  content: "Bekräfta bokning" !important;
}
```

### Option 3: Use YouCanBookMe Instead
If Swedish is critical:
- Cost: $10/month ($360 over 3 years)
- Has confirmed Swedish language support
- Integration is similar (iframe embed)
- Less features than Cal.com but gets the job done

---

## Cost Analysis (3-Year Total)

| Tool | Monthly | 3-Year Total | Notes |
|------|---------|--------------|-------|
| **Cal.com (Free)** | $0 | **$0** | ⭐ Best value, unlimited bookings |
| TidyCal | One-time | $29 | Good value, but no webhooks |
| YouCanBookMe | $10 | $360 | Swedish language support |
| Calendly Essentials | $10 | $360 | Brand name, limited free tier |
| Cal.com Essentials | $12 | $432 | Unlimited event types |
| Calendly Pro | $16 | $576 | More features |
| Acuity Emerging | $16 | $576 | Overkill for this use case |
| Cal.com Pro | $29 | $1,044 | Advanced workflows |

**Recommendation:** Start with Cal.com Free ($0), upgrade to Essentials ($12/mo) only if you need multiple event types.

---

## Implementation Checklist

### Initial Setup (1-2 hours)
- [ ] Create Cal.com account
- [ ] Set up event type "Introduktionssamtal"
- [ ] Configure availability
- [ ] Connect calendar (Google/Outlook)
- [ ] Test booking flow

### Frontend Integration (2-3 hours)
- [ ] Create `/apply/success` route
- [ ] Add Cal.com embed script
- [ ] Update form submission to redirect
- [ ] Test prefill functionality
- [ ] Style embed to match design

### Backend Integration (3-4 hours)
- [ ] Update Prisma schema (bookingId, bookingDate, status)
- [ ] Run migration
- [ ] Create webhook endpoint
- [ ] Configure Cal.com webhook
- [ ] Test webhook events

### Admin Dashboard (2-3 hours)
- [ ] Update lead card to show booking status
- [ ] Add booking date display
- [ ] Add status badges
- [ ] Test admin view

### Email Updates (1-2 hours)
- [ ] Add booking link to welcome email
- [ ] Add booking confirmation email (optional)
- [ ] Test email flow

### Testing (2-3 hours)
- [ ] Test complete flow end-to-end
- [ ] Test webhook triggers
- [ ] Test cancellation/rescheduling
- [ ] Test on mobile
- [ ] Test with different email providers

**Total Estimated Time:** 11-17 hours

---

## User Flow

1. **User fills out intresseanmälan form**
   - Selects service type (Online Coachning or 90 Dagars Utmaningen)
   - Fills in personal info, goals, etc.
   - Submits form

2. **Redirect to success page**
   - Thank you message
   - Cal.com booking embed (prefilled with name, email, service)
   - User books meeting immediately OR

3. **Email sent with booking link**
   - Welcome email with personalized Cal.com link
   - User can book later from email

4. **User books meeting on Cal.com**
   - Selects date/time
   - Confirms booking
   - Receives confirmation email from Cal.com

5. **Webhook triggers**
   - Lead updated in database with booking info
   - Status changed to "MEETING_BOOKED"
   - Admin sees updated status in dashboard

6. **Meeting day**
   - Coach receives calendar notification
   - User receives reminder from Cal.com
   - Meeting happens via Google Meet/Zoom (configured in Cal.com)

---

## Resources

- **Cal.com Documentation:** https://cal.com/docs
- **Cal.com React Embed:** https://cal.com/docs/features/embed
- **Cal.com Webhooks:** https://cal.com/docs/integrations/webhooks
- **Cal.com Free Tier:** https://cal.com/pricing
- **YouCanBookMe:** https://youcanbook.me
- **Calendly:** https://calendly.com
- **TidyCal:** https://tidycal.com

---

## Future Enhancements

### Phase 5: Advanced Features (Optional)
- Add SMS reminders via Twilio
- Create custom booking confirmation page
- Add rescheduling link in admin dashboard
- Implement automatic follow-up emails
- Add meeting notes/outcome tracking
- Create analytics dashboard for booking metrics
- Add team scheduling (multiple coaches)

### Phase 6: Self-Hosted Cal.com (Optional)
If you want full control and Swedish customization:
- Deploy Cal.com on your own server
- Full access to customize language files
- Complete control over data
- Requires technical maintenance

---

## Questions & Decisions

### Before Implementation, Decide:

1. **Swedish Language Priority:**
   - Accept English Cal.com UI? (Most Swedes understand English)
   - Or pay for YouCanBookMe for Swedish UI?

2. **Booking Timing:**
   - Embed on success page? (immediate booking)
   - Only email link? (booking later)
   - Both options? (recommended)

3. **Meeting Duration:**
   - 15 min intro call?
   - 30 min consultation? (recommended)
   - 60 min deep dive?

4. **Buffer Times:**
   - Time before meeting for prep? (e.g., 15 min)
   - Time after for notes? (e.g., 15 min)

5. **Availability:**
   - Working hours?
   - Days of the week?
   - Time zone (Sweden/Stockholm)

6. **Meeting Location:**
   - Google Meet? (recommended, free)
   - Zoom? (requires account)
   - Phone call?
   - In-person option?

---

## Conclusion

**Recommended Path:**
1. Start with Cal.com Free tier ($0)
2. Embed on success page + email link
3. Set up webhooks for automation
4. Monitor booking rates and user feedback
5. Upgrade to paid tier only if needed

**Total Cost:** $0 for first year, with option to upgrade later.

**Implementation Time:** 11-17 hours for complete integration.

**Expected Impact:**
- Higher conversion rate (easier to book = more clients)
- Less admin work (automatic scheduling)
- Better user experience (no back-and-forth emails)
- Professional impression (modern booking system)

This integration will significantly streamline the intresseanmälan → meeting → client conversion funnel.