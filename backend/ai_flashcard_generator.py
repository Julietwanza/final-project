import sys
import json
from transformers import pipeline
import spacy

# Load SpaCy model for Named Entity Recognition
# You might need to download this model first:
# python -m spacy download en_core_web_sm
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading SpaCy model 'en_core_web_sm'...", file=sys.stderr)
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Initialize the Hugging Face pipelines
# Question Generation pipeline (text2text-generation for T5-based QG models)
# This model takes text and generates questions from it.
# You may need to install 'sentencepiece' and 'torch' or 'tensorflow'
# pip install transformers sentencepiece torch (or tensorflow)
try:
    qg_pipeline = pipeline("text2text-generation", model="valhalla/t5-base-qg-hl")
except Exception as e:
    print(f"Warning: Could not load Question Generation model. Using fallback. Error: {e}", file=sys.stderr)
    qg_pipeline = None # Fallback mechanism if QG model fails

# Question Answering pipeline (for finding answers in the original context)
# This model takes a question and context and finds the answer.
qa_pipeline = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")

def generate_flashcards_advanced(context: str, num_questions: int = 5):
    """
    Generates flashcards (question-answer pairs) from a given context
    using SpaCy for NER and Hugging Face QG/QA models.
    Prioritizes questions based on recognized entities.
    """
    flashcards = []
    
    # Use SpaCy to parse the document and extract entities
    doc = nlp(context)
    
    # Store potential question-answer pairs
    potential_q_a_pairs = []

    # Strategy 1: Use Question Generation (QG) model directly on sentences/chunks
    if qg_pipeline:
        sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]
        # Try to generate questions from sentences. QG models are good at this.
        for i, sentence_chunk in enumerate(sentences):
            if len(potential_q_a_pairs) >= num_questions * 2: # Generate more, then filter
                break
            
            try:
                # Generate questions from the sentence chunk
                # The QG model can generate multiple questions, let's take one or two.
                generated_results = qg_pipeline(sentence_chunk, max_new_tokens=64, num_beams=4, do_sample=False)
                
                for result in generated_results:
                    question_text = result.get('generated_text', '').strip()
                    if question_text.lower().startswith("question:"):
                        question_text = question_text[len("question:"):].strip()
                    
                    if question_text:
                        # Use QA model to find the answer in the *full context* for accuracy
                        answer_result = qa_pipeline(question=question_text, context=context)
                        if answer_result and answer_result['score'] > 0.1: # Threshold for confidence
                            potential_q_a_pairs.append({
                                "question": question_text,
                                "answer": answer_result['answer'].strip(),
                                "score": answer_result['score']
                            })
                            if len(potential_q_a_pairs) >= num_questions:
                                break # Enough questions from QG if we are confident

            except Exception as e:
                print(f"Error during QG for sentence '{sentence_chunk[:50]}...': {e}", file=sys.stderr)
                # Continue trying with other sentences or fallbacks

    # Strategy 2: If QG is not available or didn't generate enough,
    # or for more targeted questions: Frame questions based on SpaCy entities.
    # This acts as a robust fallback and allows for specific targeting.
    if len(potential_q_a_pairs) < num_questions or not qg_pipeline:
        entity_questions = []
        for ent in doc.ents:
            # Prioritize common entity types that make good flashcards
            if ent.label_ in ["PERSON", "ORG", "GPE", "LOC", "DATE", "NORP", "EVENT", "PRODUCT", "WORK_OF_ART", "LAW"]:
                question = None
                # Basic question framing based on entity type
                if ent.label_ == "PERSON":
                    question = f"Who is {ent.text}?"
                elif ent.label_ == "ORG":
                    question = f"What is {ent.text}?"
                elif ent.label_ == "GPE" or ent.label_ == "LOC":
                    question = f"Where is {ent.text} located?"
                elif ent.label_ == "DATE":
                    question = f"When did {ent.text} happen (or what is its significance)?"
                else: # Generic question for other entities
                    question = f"What is {ent.text}?"

                if question:
                    # Use the QA model to find the answer in the original context
                    answer_result = qa_pipeline(question=question, context=context)
                    if answer_result and answer_result['score'] > 0.1:
                        entity_questions.append({
                            "question": question,
                            "answer": answer_result['answer'].strip(),
                            "score": answer_result['score']
                        })
        
        # Combine and deduplicate
        existing_questions = {pair["question"].lower() for pair in potential_q_a_pairs}
        for q_a in entity_questions:
            if q_a["question"].lower() not in existing_questions:
                potential_q_a_pairs.append(q_a)
                existing_questions.add(q_a["question"].lower())

    # Sort by score (higher confidence first) and trim to requested number
    # This step is crucial to get the "best" questions
    potential_q_a_pairs.sort(key=lambda x: x.get('score', 0), reverse=True)
    flashcards = potential_q_a_pairs[:num_questions]
    
    if not flashcards:
        # Final fallback: if no specific questions generated, try some generic ones
        # This is a less ideal fallback, as QA models need specific questions.
        generic_questions = [
            "What is the main topic discussed?",
            "Can you summarize the key points?",
            "What are the most important facts?",
            "What is mentioned about X?" # (X could be a prominent term from context)
        ]
        for gen_q in generic_questions:
            if len(flashcards) >= num_questions:
                break
            answer_result = qa_pipeline(question=gen_q, context=context)
            if answer_result and answer_result['score'] > 0.05:
                 flashcards.append({
                    "question": gen_q,
                    "answer": answer_result['answer'].strip()
                })
        
        if not flashcards:
             # If all else fails, return a default informative card
            flashcards.append({
                "question": "AI could not generate specific flashcards.",
                "answer": "Please provide more detailed or structured notes. Ensure all required Python models are installed and running."
            })

    return flashcards

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python ai_flashcard_generator.py <context_text> <num_questions>", file=sys.stderr)
        sys.exit(1)

    context_text = sys.argv[1]
    try:
        num_questions = int(sys.argv[2])
    except ValueError:
        print("Error: num_questions must be an integer.", file=sys.stderr)
        sys.exit(1)

    generated_cards = generate_flashcards_advanced(context_text, num_questions)
    print(json.dumps(generated_cards))
