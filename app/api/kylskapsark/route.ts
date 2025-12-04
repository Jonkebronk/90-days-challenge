import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'

// Färger som matchar plattformens tema (hex utan #)
const DARK_BG: [number, number, number] = [15, 15, 25]           // #0F0F19 - mörk bakgrund
const GOLD: [number, number, number] = [255, 215, 0]              // #FFD700 - guld
const GOLD_DARK: [number, number, number] = [184, 134, 11]        // #B8860B - mörk guld
const ORANGE: [number, number, number] = [249, 115, 22]           // #F97316 - orange accent
const WHITE: [number, number, number] = [255, 255, 255]
const LIGHT_GRAY: [number, number, number] = [156, 163, 175]      // #9CA3AF
const DARK_GRAY: [number, number, number] = [75, 85, 99]          // #4B5563
const CARD_BG: [number, number, number] = [26, 26, 46]            // #1A1A2E - kort bakgrund

// A4 dimensioner i mm
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 20

export async function GET() {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // ===== SIDA 1 =====
    drawPage1(doc)

    // ===== SIDA 2 =====
    doc.addPage()
    drawPage2(doc)

    // Generera PDF som buffer
    const pdfBuffer = doc.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="kylskapsark_mal_och_drivkrafter.pdf"',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

function drawPage1(doc: jsPDF) {
  let y = 0

  // Hela sidan har samma mörka bakgrund
  doc.setFillColor(...CARD_BG)
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')

  // Guld-linje under header
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(1)
  doc.line(MARGIN, 40, PAGE_WIDTH - MARGIN, 40)

  // Header text
  doc.setTextColor(...GOLD)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('MITT M\xc5L OCH MINA DRIVKRAFTER', PAGE_WIDTH / 2, 25, { align: 'center' })

  // Subheader
  doc.setTextColor(...LIGHT_GRAY)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('90-Dagars Utmaningen', PAGE_WIDTH / 2, 33, { align: 'center' })

  y = 50

  // Sektion 1: MITT MÅL
  y = drawSectionHeader(doc, y, 'MITT M\xc5L')
  y = drawInputLines(doc, y, 'Vad \xe4r ditt specifika, m\xe4tbara m\xe5l?', 2)

  // Deadline with white background
  doc.setTextColor(...LIGHT_GRAY)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Deadline:', MARGIN, y)

  // White box for deadline
  doc.setFillColor(...WHITE)
  doc.roundedRect(MARGIN + 22, y - 5, 50, 8, 1, 1, 'F')

  y += 10

  // Sektion 2: VARFÖR ÄR DETTA VIKTIGT FÖR MIG?
  y = drawSectionHeader(doc, y, 'VARF\xd6R \xc4R DETTA VIKTIGT F\xd6R MIG?')
  y = drawInputLines(doc, y, 'Gr\xe4v djupt. Vad driver dig egentligen? Vilka v\xe4rderingar kopplar detta till?', 3)

  // Sektion 3: HUR SER MITT LIV UT NÄR JAG NÅTT MÅLET?
  y = drawSectionHeader(doc, y, 'HUR SER MITT LIV UT N\xc4R JAG N\xc5TT M\xc5LET?')
  y = drawInputLines(doc, y, 'Beskriv din vardag. Hur k\xe4nns det? Vad g\xf6r du annorlunda? Hur ser du ut?', 3)

  // Sektion 4: VAD HÄNDER OM JAG INTE GÖR FÖRÄNDRINGEN?
  y = drawSectionHeader(doc, y, 'VAD H\xc4NDER OM JAG INTE G\xd6R F\xd6R\xc4NDRINGEN?')
  y = drawInputLines(doc, y, 'Hur ser livet ut om 1 \xe5r, 5 \xe5r om du INTE f\xf6r\xe4ndrar n\xe5got?', 2)

  // Sektion 5: NÄR DET BLIR TUFFT PÅMINNER JAG MIG OM
  y = drawSectionHeader(doc, y, 'N\xc4R DET BLIR TUFFT P\xc5MINNER JAG MIG OM:')
  y = drawInputLines(doc, y, 'Vad ska du s\xe4ga till dig sj\xe4lv n\xe4r motivationen sviker?', 2)

  // Sektion 6: MITT LÖFTE TILL MIG SJÄLV
  y = drawSectionHeader(doc, y, 'MITT L\xd6FTE TILL MIG SJ\xc4LV')
  y = drawInputLines(doc, y, 'Skriv ett personligt \xe5tagande. Vad lovar du dig sj\xe4lv?', 2)

  // Datum och Signatur with white backgrounds
  y += 3
  doc.setTextColor(...LIGHT_GRAY)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Datum:', MARGIN, y)

  // White box for datum
  doc.setFillColor(...WHITE)
  doc.roundedRect(MARGIN + 17, y - 5, 40, 8, 1, 1, 'F')

  doc.text('Signatur:', 80, y)

  // White box for signatur
  doc.setFillColor(...WHITE)
  doc.roundedRect(102, y - 5, PAGE_WIDTH - MARGIN - 102, 8, 1, 1, 'F')

  // Citat-ruta
  y += 12
  const quoteBoxHeight = 20

  // Guld border på citat-rutan (ingen separat bakgrund)
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.5)
  doc.roundedRect(MARGIN, y, PAGE_WIDTH - 2 * MARGIN, quoteBoxHeight, 3, 3, 'S')

  doc.setTextColor(...GOLD)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  const quote = '"Det finns inga lata m\xe4nniskor, det finns bara m\xe4nniskor med kraftl\xf6sa m\xe5ls\xe4ttningar som inte inspirerar dem."'
  doc.text(quote, PAGE_WIDTH / 2, y + 8, { align: 'center', maxWidth: PAGE_WIDTH - 2 * MARGIN - 10 })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...LIGHT_GRAY)
  doc.text('- Anthony Robbins', PAGE_WIDTH / 2, y + 15, { align: 'center' })
}

function drawPage2(doc: jsPDF) {
  let y = 0

  // Hela sidan har samma mörka bakgrund
  doc.setFillColor(...CARD_BG)
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')

  // Guld-linje under header
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(1)
  doc.line(MARGIN, 30, PAGE_WIDTH - MARGIN, 30)

  // Header text
  doc.setTextColor(...GOLD)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('F\xd6RDJUPADE DRIVKRAFTSFR\xc5GOR', PAGE_WIDTH / 2, 19, { align: 'center' })

  y = 40

  // Sektion 1: UTFORSKA NYTTAN
  y = drawSectionHeader(doc, y, 'UTFORSKA NYTTAN')
  y = drawInputLines(doc, y, 'Vilka nyttor f\xe5r jag om jag n\xe5r m\xe5let? (Lista allt du kommer p\xe5)', 3)

  // Sektion 2: UTFORSKA FÖRÄNDRINGEN
  y = drawSectionHeader(doc, y, 'UTFORSKA F\xd6R\xc4NDRINGEN')
  y = drawInputLines(doc, y, 'Vad kommer att vara annorlunda? (Energi, sj\xe4lvf\xf6rtroende, kl\xe4der, relationer, aktiviteter)', 2)

  // Sektion 3: UTFORSKA HINDREN
  y = drawSectionHeader(doc, y, 'UTFORSKA HINDREN')
  y = drawInputLines(doc, y, 'Vad kommer att vara l\xe4tt? Vad kommer att vara sv\xe5rt/ovant?', 2)

  // Sektion 4: TIDIGARE ERFARENHETER
  y = drawSectionHeader(doc, y, 'TIDIGARE ERFARENHETER')
  y = drawInputLines(doc, y, 'Vad har du lyckats med tidigare? Vad fungerade d\xe5?', 2)

  // Sektion 5: BIBEHÅLLA RESULTATEN
  y = drawSectionHeader(doc, y, 'BIBEH\xc5LLA RESULTATEN')
  y = drawInputLines(doc, y, 'Hur ska du h\xe5lla kvar det goda efter att du n\xe5tt m\xe5let?', 2)

  // Sektion 6: MINA STYRKOR ATT ANVÄNDA
  y = drawSectionHeader(doc, y, 'MINA STYRKOR ATT ANV\xc4NDA')

  const styrkor = [
    'Jag \xe4r disciplinerad n\xe4r jag best\xe4mt mig',
    'Jag \xe4r bra p\xe5 att planera',
    'Jag har st\xf6d fr\xe5n familj/v\xe4nner',
    'Jag har lyckats med utmaningar tidigare',
    'Jag \xe4r envis och ger inte upp l\xe4tt',
    'Jag kan anpassa mig n\xe4r planer \xe4ndras'
  ]

  const col1X = MARGIN + 2
  const col2X = PAGE_WIDTH / 2 + 5
  const checkboxSize = 3.5

  for (let i = 0; i < styrkor.length; i++) {
    const x = i < 3 ? col1X : col2X
    const row = i < 3 ? i : i - 3
    const itemY = y + row * 6

    // Checkbox med guld border
    doc.setDrawColor(...GOLD)
    doc.setLineWidth(0.5)
    doc.rect(x, itemY - 2.5, checkboxSize, checkboxSize)

    // Text
    doc.setTextColor(...LIGHT_GRAY)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(styrkor[i], x + checkboxSize + 2, itemY)
  }

  y += 22

  // Annan styrka with white background
  doc.setTextColor(...LIGHT_GRAY)
  doc.setFontSize(9)
  doc.text('Annan styrka:', MARGIN + 2, y)

  // White box for input
  doc.setFillColor(...WHITE)
  doc.roundedRect(MARGIN + 30, y - 5, PAGE_WIDTH - MARGIN - MARGIN - 30, 8, 1, 1, 'F')

  y += 12

  // Tips-ruta
  const tipsBoxHeight = 30

  // Guld border på tips-rutan (ingen separat bakgrund)
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.5)
  doc.roundedRect(MARGIN, y, PAGE_WIDTH - 2 * MARGIN, tipsBoxHeight, 3, 3, 'S')

  doc.setTextColor(...GOLD)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Tips f\xf6r att anv\xe4nda detta ark:', MARGIN + 5, y + 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...LIGHT_GRAY)

  const tips = [
    '\u2022 S\xe4tt upp arket d\xe4r du ser det dagligen (kylsk\xe5pet, badrumsspegeln, vid datorn)',
    '\u2022 L\xe4s igenom dina drivkrafter varje morgon eller n\xe4r motivationen sviker',
    '\u2022 Uppdatera arket om dina m\xe5l eller drivkrafter f\xf6r\xe4ndras under resans g\xe5ng'
  ]

  tips.forEach((tip, i) => {
    doc.text(tip, MARGIN + 5, y + 14 + i * 5)
  })
}

function drawSectionHeader(doc: jsPDF, y: number, title: string): number {
  doc.setTextColor(...GOLD)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(title, MARGIN, y)

  // Gradient-liknande linje under rubriken (guld till orange)
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.8)
  doc.line(MARGIN, y + 2, PAGE_WIDTH - MARGIN, y + 2)

  return y + 8
}

function drawInputLines(doc: jsPDF, y: number, label: string, numLines: number): number {
  doc.setTextColor(...LIGHT_GRAY)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(label, MARGIN, y)

  y += 4

  // Draw white background boxes for writing
  const lineHeight = 8
  const boxHeight = numLines * lineHeight + 4

  doc.setFillColor(...WHITE)
  doc.roundedRect(MARGIN, y - 2, PAGE_WIDTH - 2 * MARGIN, boxHeight, 2, 2, 'F')

  // Draw lines inside the white box
  doc.setDrawColor(...LIGHT_GRAY)
  doc.setLineWidth(0.2)

  for (let i = 0; i < numLines; i++) {
    const lineY = y + 4 + i * lineHeight
    doc.line(MARGIN + 3, lineY, PAGE_WIDTH - MARGIN - 3, lineY)
  }

  return y + boxHeight + 4
}
