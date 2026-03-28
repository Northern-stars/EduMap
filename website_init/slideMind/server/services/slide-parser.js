import JSZip from 'jszip'

/**
 * Parse PPTX file and extract text content
 */
export async function parsePPTX(buffer) {
  try {
    const zip = await JSZip.loadAsync(buffer)
    const textContent = []
    
    // PPTX is a ZIP archive - slides are in ppt/slides/
    const slideFiles = Object.keys(zip.files).filter(path => 
      path.match(/^ppt\/slides\/slide\d+\.xml$/)
    )
    
    for (const slidePath of slideFiles.sort()) {
      const slideContent = await zip.files[slidePath].async('string')
      const text = extractTextFromSlideXML(slideContent)
      if (text) {
        textContent.push(text)
      }
    }
    
    return textContent.join('\n\n')
  } catch (error) {
    console.error('PPTX parsing error:', error)
    throw new Error('Failed to parse PPTX file')
  }
}

/**
 * Extract text from slide XML using regex (no external DOM parser needed)
 */
function extractTextFromSlideXML(xmlString) {
  try {
    // Find all text elements <a:t>...</a:t>
    const textMatches = xmlString.match(/<a:t[^>]*>([^<]*)<\/a:t>/g)
    if (!textMatches) return ''
    
    const texts = textMatches.map(match => {
      const content = match.replace(/<a:t[^>]*>/, '').replace(/<\/a:t>/, '')
      return decodeXMLEntities(content)
    }).filter(t => t.trim().length > 0)
    
    return texts.join(' ')
  } catch (error) {
    console.error('Text extraction error:', error)
    return ''
  }
}

/**
 * Decode basic XML entities
 */
function decodeXMLEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
}

/**
 * Parse PDF file and extract text content
 */
export async function parsePDF(buffer) {
  try {
    // Dynamic import to handle ES modules
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error('Failed to parse PDF file')
  }
}

/**
 * Parse image file - returns placeholder for OCR
 * In production, integrate with OCR service like Google Vision or Tesseract
 */
export async function parseImage(buffer, filename) {
  return `[Image content from ${filename}]\nImage parsing requires OCR integration. Please convert to PDF or PPTX for text extraction.`
}
