"""Test program for api_calling chat functionality"""
import os
from api_calling import api_access, pptx_to_images

# Use default key from api_calling.py (hardcoded)
print("Using API key from api_calling.py")


def test_chat():
    """Test basic chat functionality"""
    print("=" * 50)
    print("Test 1: Basic Chat")
    print("=" * 50)

    api = api_access()  # Uses default key from api_calling.py

    # Simple conversation
    messages = [
        ["user", "Hello, can you introduce yourself?"],
    ]

    try:
        response = api.read_text(messages)
        print(f"Response: {response}")
        print("Test 1: PASSED\n")
    except Exception as e:
        print(f"Test 1: FAILED - {e}\n")


def test_multiturn_chat():
    """Test multi-turn conversation"""
    print("=" * 50)
    print("Test 2: Multi-turn Chat")
    print("=" * 50)

    api = api_access()  # Uses default key from api_calling.py

    # Multi-turn conversation
    messages = [
        ["user", "What is machine learning?"],
        ["assistant", "Machine learning is a subset of artificial intelligence..."],
        ["user", "Can you give me an example?"],
    ]

    try:
        response = api.read_text(messages)
        print(f"Response: {response}")
        print("Test 2: PASSED\n")
    except Exception as e:
        print(f"Test 2: FAILED - {e}\n")


def test_pptx_conversion():
    """Test PPTX to images conversion"""
    print("=" * 50)
    print("Test 3: PPTX to Images Conversion")
    print("=" * 50)

    pptx_path = os.path.join(os.path.dirname(__file__), "uploads", "test.pptx")

    if not os.path.exists(pptx_path):
        print(f"Test file not found: {pptx_path}")
        print("Test 3: SKIPPED\n")
        return

    try:
        images = pptx_to_images(pptx_path)
        print(f"Converted {len(images)} slides to images")
        if images:
            print(f"First image size: {images[0].size}")
        print("Test 3: PASSED\n")
    except Exception as e:
        print(f"Test 3: FAILED - {e}\n")


def test_pptx_image_analysis():
    """Test PPTX image analysis with AI model"""
    print("=" * 50)
    print("Test 3b: PPTX Image Analysis")
    print("=" * 50)

    pptx_path = os.path.join(os.path.dirname(__file__), "uploads", "test.pptx")

    if not os.path.exists(pptx_path):
        print(f"Test file not found: {pptx_path}")
        print("Test 3b: SKIPPED\n")
        return

    api = api_access()

    try:
        print(f"Analyzing PPTX: {pptx_path}")
        results = api.analyze_pptx_images(pptx_path, prompt="请描述这张幻灯片的内容")

        print(f"\nTotal slides analyzed: {len(results)}")
        for result in results:
            print(f"\n--- Page {result['page']} ---")
            print(f"Response: {result['response'][:200]}..." if len(result.get('response', '')) > 200 else f"Response: {result.get('response', '')}")

        print("\nTest 3b: PASSED\n")
    except Exception as e:
        print(f"Test 3b: FAILED - {e}\n")


def test_txt_file():
    """Test TXT file parsing"""
    print("=" * 50)
    print("Test 4: TXT File Parsing")
    print("=" * 50)

    from services.slide_parser import parse_txt

    txt_path = os.path.join(os.path.dirname(__file__), "uploads", "test.txt")

    # Create a test txt if not exists
    if not os.path.exists(txt_path):
        print("test.txt not found, creating sample...")
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write("This is a test document.\nMachine learning is a subset of AI.\nDeep learning uses neural networks.")

    try:
        result = parse_txt(txt_path, "test-txt", "test.txt")
        print(f"Content: {result['content'][:100]}...")
        print(f"Summary: {result['summary']}")
        print("Test 4: PASSED\n")
    except Exception as e:
        print(f"Test 4: FAILED - {e}\n")


def test_docx_file():
    """Test DOCX file parsing"""
    print("=" * 50)
    print("Test 5: DOCX File Parsing")
    print("=" * 50)

    from services.slide_parser import parse_docx

    docx_path = os.path.join(os.path.dirname(__file__), "uploads", "test.docx")

    if not os.path.exists(docx_path):
        print(f"Test file not found: {docx_path}")
        print("Test 5: SKIPPED\n")
        return

    try:
        result = parse_docx(docx_path, "test-docx", "test.docx")
        print(f"Content length: {len(result['content'])} chars")
        print(f"Summary: {result['summary'][:100]}...")
        print("Test 5: PASSED\n")
    except Exception as e:
        print(f"Test 5: FAILED - {e}\n")


def main():
    print("\n" + "=" * 50)
    print("API Calling Test Suite")
    print("=" * 50 + "\n")

    # test_chat()
    # test_multiturn_chat()
    test_pptx_conversion()
    test_pptx_image_analysis()
    # test_txt_file()
    # test_docx_file()

    print("=" * 50)
    print("All tests completed")
    print("=" * 50)


if __name__ == "__main__":
    main()
