export const QUERY_INTERPRETATION_PROMPT = `You are a B2B procurement specialist. Analyze the user's search query and extract structured information.

Return a JSON object with:
- category: the product/service category (e.g., "freight forwarding", "bulk cement", "industrial machinery")
- searchTerms: array of 3-5 search terms to use in web searches
- attributes: array of key vendor attributes to look for (e.g., ["ISO certified", "global network", "24/7 support"])

Be concise. Return only valid JSON.`;

export const VENDOR_EXTRACTION_PROMPT = `You are a vendor research assistant. Extract distinct vendors from these web search results.

For each vendor return:
- name: company name
- website: domain or URL (without trailing slash)
- description: 1-2 sentence description of what they do
- country: country where headquartered (ISO name)
- region: geographic region (e.g., "Southeast Asia", "Europe", "North America")
- estimatedPrice: price range if mentioned (free text, e.g. "$50-200/unit" or null)
- aiScore: relevance score 0-100 based on match to the original query
- aiTags: array of 2-5 tags (e.g., ["freight", "ISO-9001", "Asia-Pacific"])
- emails: any email addresses found in the snippets (array, can be empty)
- phone: phone number if found (string or null)

Rules:
- Deduplicate by website domain
- Ignore directory listings, review sites, social profiles (LinkedIn company pages OK)
- Only include actual vendor companies, not aggregators
- Return a JSON array of vendor objects

Query context: {{query}} in region: {{region}}`;

export const EMAIL_EXTRACTION_PROMPT = `Extract all email addresses from the following text. Return a JSON array of email strings only. If none found, return an empty array.

Text:
{{text}}`;

export const QUOTE_EXTRACTION_PROMPT = `You are a procurement specialist. Extract structured data from this vendor quote email.

Return a JSON object with these fields (use null if not found):
- price: numeric price (number or null)
- currency: 3-letter currency code (string or null)
- leadTimeDays: lead time in calendar days (number or null)
- validUntil: quote validity date in ISO 8601 format (string or null)
- terms: payment terms summary (string or null)
- summary: 2-3 sentence summary of the quote (string)
- conditions: any important conditions or exclusions (string or null)

Return only valid JSON.

Email content:
{{emailText}}`;

export const RFQ_DRAFT_PROMPT = `You are a professional procurement writer. Draft an RFQ (Request for Quotation) email for the following requirement.

Company: {{companyName}}
Product/Service: {{query}}
Region preference: {{region}}

Write a professional, concise RFQ email body (HTML format) that:
1. Introduces the company briefly
2. Describes what is being procured
3. Requests: pricing, lead time, minimum order quantity, payment terms, delivery terms (Incoterms if applicable)
4. Sets a deadline for response
5. Includes a professional sign-off

Use {{vendorName}} as a placeholder for the vendor name. Keep it under 300 words. Return only the HTML body content (no <html>/<body> tags).`;

export const TENDER_TEMPLATE_PROMPT = `Generate a formal tender award letter in HTML format.

Details:
- Buyer Company: {{companyName}}
- Vendor: {{vendorName}}
- Product/Service: {{productDescription}}
- Agreed Price: {{price}} {{currency}}
- Delivery Date: {{deliveryDate}}
- Terms: {{terms}}
- Tender Number: {{tenderNumber}}

Write a formal, professional tender award document that:
1. States the award clearly
2. Confirms all commercial terms
3. Outlines next steps and acceptance requirements
4. Is formatted as a business letter

Return only the HTML body content.`;
