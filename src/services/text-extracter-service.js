const {DocumentProcessorServiceClient} = require('@google-cloud/documentai').v1;
const credentials  = require('../../credentials.json');

const projectId = 'subtle-canto-456303-s8';
const location = 'us';
const processorId = 'cf6e2b573d0be008';

const client = new DocumentProcessorServiceClient({
    credentials: credentials,
    projectId: projectId
});

  
const processorName = `projects/${projectId}/locations/${location}/processors/${processorId}`;

async function extractTextWithDocumentAI(fileBuffer) {
  console.log(`Starting Document AI text extraction, buffer size: ${fileBuffer.length}`);
  
  try {
    const encodedImage = Buffer.from(fileBuffer).toString('base64');
    console.log(`Converted buffer to base64 string, length: ${encodedImage.length}`);
    
    const request = {
      name: processorName,
      rawDocument: {
        content: encodedImage,
        mimeType: 'application/pdf',
      },
    };
    
    console.log(`Sending document to Document AI processor: ${processorName}`);
    const [result] = await client.processDocument(request);
    console.log(`Document AI processing complete`);
    
    const {document} = result;
    
    // Get full text with page information
    let fullText = '';
    console.log(`Document has ${document.pages.length} pages`);
    
    for (const page of document.pages) {
      const pageNumber = page.pageNumber;
      let pageText = '';
      
      // Extract text blocks from page
      console.log(`Processing page ${pageNumber} with ${page.paragraphs?.length || 0} paragraphs`);
      
      if (page.paragraphs && page.paragraphs.length > 0) {
        for (const paragraph of page.paragraphs) {
          pageText += paragraph.text + '\n';
        }
      } else {
        console.log(`No paragraphs found on page ${pageNumber}, using page text`);
        pageText = page.text || '';
      }
      
      fullText += pageText + `\n[Page ${pageNumber}]\n\n`;
    }
    
    console.log(`Extracted ${fullText.length} characters of text`);
    return fullText;
  } catch (error) {
    console.error(`Error extracting text with Document AI: ${error.message}`);
    console.error(error.stack);
    throw new Error(`Document AI extraction failed: ${error.message}`);
  }
}

module.exports = {
  extractTextWithDocumentAI
};