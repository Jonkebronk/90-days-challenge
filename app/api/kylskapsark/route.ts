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
  doc.text('MITT MAL OCH MINA DRIVKRAFTER', PAGE_WIDTH / 2, 22, { align: 'center' })

  y = 45

  // Sektion 1: MITT MÅL
  y = drawSectionHeader(doc, y, 'MITT MAL')
  y = drawInputLines(doc, y, 'Vad ar ditt specifika, matbara mal?', 2)

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
  y = drawSectionHeader(doc, y, 'VARFOR AR DETTA VIKTIGT FOR MIG?')
  y = drawInputLines(doc, y, 'Grav djupt. Vad driver dig egentligen? Vilka varderingar kopplar detta till?', 3)

  // Sektion 3: HUR SER MITT LIV UT NÄR JAG NÅTT MÅLET?
  y = drawSectionHeader(doc, y, 'HUR SER MITT LIV UT NAR JAG NATT MALET?')
  y = drawInputLines(doc, y, 'Beskriv din vardag. Hur kanns det? Vad gor du annorlunda? Hur ser du ut?', 3)

  // Sektion 4: VAD HÄNDER OM JAG INTE GÖR FÖRÄNDRINGEN?
  y = drawSectionHeader(doc, y, 'VAD HANDER OM JAG INTE GOR FORANDRINGEN?')
  y = drawInputLines(doc, y, 'Hur ser livet ut om 1 ar, 5 ar om du INTE forandrar nagot?', 2)

  // Sektion 5: NÄR DET BLIR TUFFT PÅMINNER JAG MIG OM
  y = drawSectionHeader(doc, y, 'NAR DET BLIR TUFFT PAMINNER JAG MIG OM:')
  y = drawInputLines(doc, y, 'Vad ska du saga till dig sjalv nar motivationen sviker?', 2)

  // Sektion 6: MITT LÖFTE TILL MIG SJÄLV
  y = drawSectionHeader(doc, y, 'MITT LOFTE TILL MIG SJALV')
  y = drawInputLines(doc, y, 'Skriv ett personligt atagande. Vad lovar du dig sjalv?', 2)

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
  const quote = '"Det finns inga lata manniskor, det finns bara manniskor med kraftlosa malsattningar som inte inspirerar dem."'
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
  doc.text('FORDJUPADE DRIVKRAFTSFRAGOR', PAGE_WIDTH / 2, 16, { align: 'center' })

  y = 35

  // Sektion 1: UTFORSKA NYTTAN
  y = drawSectionHeader(doc, y, 'UTFORSKA NYTTAN')
  y = drawInputLines(doc, y, 'Vilka nyttor far jag om jag nar malet? (Lista allt du kommer pa)', 4)

  // Sektion 2: UTFORSKA FÖRÄNDRINGEN
  y = drawSectionHeader(doc, y, 'UTFORSKA FORANDRINGEN')
  y = drawInputLines(doc, y, 'Vad kommer att vara annorlunda? (Energi, sjalvfortroende, klader, relationer, aktiviteter)', 3)

  // Sektion 3: UTFORSKA HINDREN
  y = drawSectionHeader(doc, y, 'UTFORSKA HINDREN')
  y = drawInputLines(doc, y, 'Vad kommer att vara latt? Vad kommer att vara svart/ovant?', 3)

  // Sektion 4: TIDIGARE ERFARENHETER
  y = drawSectionHeader(doc, y, 'TIDIGARE ERFARENHETER')
  y = drawInputLines(doc, y, 'Vad har du lyckats med tidigare? Vad fungerade da?', 2)

  // Sektion 5: BIBEHÅLLA RESULTATEN
  y = drawSectionHeader(doc, y, 'BIBEHALLA RESULTATEN')
  y = drawInputLines(doc, y, 'Hur ska du halla kvar det goda efter att du natt malet?', 2)

  // Sektion 6: MINA STYRKOR ATT ANVÄNDA
  y = drawSectionHeader(doc, y, 'MINA STYRKOR ATT ANVANDA')

  const styrkor = [
    'Jag ar disciplinerad nar jag bestamt mig',
    'Jag ar bra pa att planera',
    'Jag har stod fran familj/vanner',
    'Jag har lyckats med utmaningar tidigare',
    'Jag ar envis och ger inte upp latt',
    'Jag kan anpassa mig nar planer andras'
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
  doc.text('Tips for att anvanda detta ark:', MARGIN + 5, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...DARK_GRAY)

  const tips = [
    '• Satt upp arket dar du ser det dagligen (kylskapet, badrumsspegeln, vid datorn)',
    '• Las igenom dina drivkrafter varje morgon eller nar motivationen sviker',
    '• Uppdatera arket om dina mal eller drivkrafter forandras under resans gang'
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
