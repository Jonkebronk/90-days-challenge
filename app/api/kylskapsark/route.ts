import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'

// Färger (hex utan #)
const PRIMARY_COLOR: [number, number, number] = [44, 62, 80]    // #2C3E50 - mörkblå
const ACCENT_COLOR: [number, number, number] = [52, 152, 219]   // #3498DB - ljusblå
const LIGHT_GRAY: [number, number, number] = [236, 240, 241]    // #ECF0F1
const DARK_GRAY: [number, number, number] = [127, 140, 141]     // #7F8C8D
const LINE_COLOR: [number, number, number] = [189, 195, 199]    // #BDC3C7
const WHITE: [number, number, number] = [255, 255, 255]

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

  // Header bakgrund
  doc.setFillColor(...PRIMARY_COLOR)
  doc.rect(0, 0, PAGE_WIDTH, 35, 'F')

  // Header text
  doc.setTextColor(...WHITE)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('MITT M\xc5L OCH MINA DRIVKRAFTER', PAGE_WIDTH / 2, 22, { align: 'center' })

  y = 45

  // Sektion 1: MITT MÅL
  y = drawSectionHeader(doc, y, 'MITT M\xc5L')
  y = drawInputLines(doc, y, 'Vad \xe4r ditt specifika, m\xe4tbara m\xe5l?', 2)

  // Deadline
  doc.setTextColor(...DARK_GRAY)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Deadline:', MARGIN, y)
  doc.setDrawColor(...LINE_COLOR)
  doc.setLineWidth(0.3)
  doc.line(MARGIN + 20, y, 90, y)
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

  // Datum och Signatur
  y += 3
  doc.setTextColor(...DARK_GRAY)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Datum:', MARGIN, y)
  doc.setDrawColor(...LINE_COLOR)
  doc.line(MARGIN + 15, y, 60, y)

  doc.text('Signatur:', 80, y)
  doc.line(100, y, PAGE_WIDTH - MARGIN, y)

  // Citat-ruta
  y += 12
  const quoteBoxHeight = 18
  doc.setFillColor(...LIGHT_GRAY)
  doc.roundedRect(MARGIN, y, PAGE_WIDTH - 2 * MARGIN, quoteBoxHeight, 2, 2, 'F')

  doc.setTextColor(...PRIMARY_COLOR)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  const quote = '"Det finns inga lata m\xe4nniskor, det finns bara m\xe4nniskor med kraftl\xf6sa m\xe5ls\xe4ttningar som inte inspirerar dem."'
  doc.text(quote, PAGE_WIDTH / 2, y + 7, { align: 'center', maxWidth: PAGE_WIDTH - 2 * MARGIN - 10 })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('- Anthony Robbins', PAGE_WIDTH / 2, y + 13, { align: 'center' })
}

function drawPage2(doc: jsPDF) {
  let y = 0

  // Header bakgrund
  doc.setFillColor(...PRIMARY_COLOR)
  doc.rect(0, 0, PAGE_WIDTH, 25, 'F')

  // Header text
  doc.setTextColor(...WHITE)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('F\xd6RDJUPADE DRIVKRAFTSFR\xc5GOR', PAGE_WIDTH / 2, 16, { align: 'center' })

  y = 35

  // Sektion 1: UTFORSKA NYTTAN
  y = drawSectionHeader(doc, y, 'UTFORSKA NYTTAN')
  y = drawInputLines(doc, y, 'Vilka nyttor f\xe5r jag om jag n\xe5r m\xe5let? (Lista allt du kommer p\xe5)', 4)

  // Sektion 2: UTFORSKA FÖRÄNDRINGEN
  y = drawSectionHeader(doc, y, 'UTFORSKA F\xd6R\xc4NDRINGEN')
  y = drawInputLines(doc, y, 'Vad kommer att vara annorlunda? (Energi, sj\xe4lvf\xf6rtroende, kl\xe4der, relationer, aktiviteter)', 3)

  // Sektion 3: UTFORSKA HINDREN
  y = drawSectionHeader(doc, y, 'UTFORSKA HINDREN')
  y = drawInputLines(doc, y, 'Vad kommer att vara l\xe4tt? Vad kommer att vara sv\xe5rt/ovant?', 3)

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

    // Checkbox
    doc.setDrawColor(...LINE_COLOR)
    doc.setLineWidth(0.5)
    doc.rect(x, itemY - 2.5, checkboxSize, checkboxSize)

    // Text
    doc.setTextColor(...DARK_GRAY)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(styrkor[i], x + checkboxSize + 2, itemY)
  }

  y += 22

  // Annan styrka
  doc.setTextColor(...DARK_GRAY)
  doc.setFontSize(9)
  doc.text('Annan styrka:', MARGIN + 2, y)
  doc.setDrawColor(...LINE_COLOR)
  doc.line(MARGIN + 28, y, PAGE_WIDTH - MARGIN, y)

  y += 12

  // Tips-ruta
  const tipsBoxHeight = 28
  doc.setFillColor(...LIGHT_GRAY)
  doc.roundedRect(MARGIN, y, PAGE_WIDTH - 2 * MARGIN, tipsBoxHeight, 2, 2, 'F')

  doc.setTextColor(...PRIMARY_COLOR)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Tips f\xf6r att anv\xe4nda detta ark:', MARGIN + 5, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...DARK_GRAY)

  const tips = [
    '\u2022 S\xe4tt upp arket d\xe4r du ser det dagligen (kylsk\xe5pet, badrumsspegeln, vid datorn)',
    '\u2022 L\xe4s igenom dina drivkrafter varje morgon eller n\xe4r motivationen sviker',
    '\u2022 Uppdatera arket om dina m\xe5l eller drivkrafter f\xf6r\xe4ndras under resans g\xe5ng'
  ]

  tips.forEach((tip, i) => {
    doc.text(tip, MARGIN + 5, y + 12 + i * 5)
  })
}

function drawSectionHeader(doc: jsPDF, y: number, title: string): number {
  doc.setTextColor(...ACCENT_COLOR)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(title, MARGIN, y)

  // Linje under rubriken
  doc.setDrawColor(...ACCENT_COLOR)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y + 2, PAGE_WIDTH - MARGIN, y + 2)

  return y + 8
}

function drawInputLines(doc: jsPDF, y: number, label: string, numLines: number): number {
  doc.setTextColor(...DARK_GRAY)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(label, MARGIN, y)

  y += 4

  doc.setDrawColor(...LINE_COLOR)
  doc.setLineWidth(0.3)

  for (let i = 0; i < numLines; i++) {
    const lineY = y + i * 7
    doc.line(MARGIN, lineY, PAGE_WIDTH - MARGIN, lineY)
  }

  return y + numLines * 7 + 4
}
