from app.services.pdf_parser import extract_text_from_pdf


pages = extract_text_from_pdf(
    "storage/sample_rag_document.pdf"
)

print(f"Total pages: {len(pages)}")

for page in pages[:3]:
    print("\n--- PAGE", page["page_number"], "---")
    print(page["text"][:500])