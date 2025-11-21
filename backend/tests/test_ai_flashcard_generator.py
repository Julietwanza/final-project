import pytest
from unittest.mock import patch, MagicMock
from ai_flashcard_generator import generate_flashcards_advanced

# Mock the Hugging Face and SpaCy pipelines for faster and isolated tests.
# This prevents actual API calls or heavy model loading during unit tests.

@pytest.fixture(autouse=True)
def mock_pipelines():
    # Mock for Hugging Face Question Generation pipeline
    with patch('ai_flashcard_generator.pipeline') as mock_hf_pipeline:
        mock_qg_instance = MagicMock()
        mock_qg_instance.return_value = [
            {'generated_text': 'question: What is Paris?'},
            {'generated_text': 'question: When did WWII end?'}
        ]
        
        # Mock for Hugging Face Question Answering pipeline
        mock_qa_instance = MagicMock()
        mock_qa_instance.side_effect = [
            {'answer': 'the capital of France', 'score': 0.95},
            {'answer': 'in 1945', 'score': 0.98}
        ]

        # Configure the pipeline mock to return specific instances based on task
        def side_effect_pipeline(task, **kwargs):
            if task == "text2text-generation":
                return mock_qg_instance
            elif task == "question-answering":
                return mock_qa_instance
            return MagicMock() # Fallback for any other pipeline

        mock_hf_pipeline.side_effect = side_effect_pipeline
        
        # Mock for SpaCy
        with patch('ai_flashcard_generator.spacy') as mock_spacy:
            mock_doc = MagicMock()
            mock_doc.sents = [MagicMock(text="Paris is the capital of France."), MagicMock(text="WWII ended in 1945.")]
            
            # Mock named entities
            mock_ent_paris = MagicMock()
            mock_ent_paris.text = "Paris"
            mock_ent_paris.label_ = "GPE"
            
            mock_ent_wwii = MagicMock()
            mock_ent_wwii.text = "WWII"
            mock_ent_wwii.label_ = "EVENT"

            mock_ent_1945 = MagicMock()
            mock_ent_1945.text = "1945"
            mock_ent_1945.label_ = "DATE"
            
            mock_doc.ents = [mock_ent_paris, mock_ent_wwii, mock_ent_1945]
            
            mock_spacy.load.return_value = MagicMock(return_value=mock_doc)
            yield

def test_generate_flashcards_advanced_success(mock_pipelines):
    context = "Paris is the capital of France. The Eiffel Tower is a famous landmark. World War II ended in 1945."
    num_questions = 2
    
    flashcards = generate_flashcards_advanced(context, num_questions)
    
    assert len(flashcards) == num_questions
    assert flashcards[0]["question"] == "What is Paris?"
    assert flashcards[0]["answer"] == "the capital of France"
    assert flashcards[1]["question"] == "When did WWII end?"
    assert flashcards[1]["answer"] == "in 1945"

    # Verify that the QA pipeline was called for each generated question
    # and the QG pipeline for sentence chunks
    mock_pipelines.__enter__.return_value.side_effect("question-answering").assert_any_call(
        question="What is Paris?",
        context=context
    )
    mock_pipelines.__enter__.return_value.side_effect("question-answering").assert_any_call(
        question="When did WWII end?",
        context=context
    )
    mock_pipelines.__enter__.return_value.side_effect("text2text-generation").assert_any_call(
        "Paris is the capital of France.", max_new_tokens=64, num_beams=4, do_sample=False
    )
    mock_pipelines.__enter__.return_value.side_effect("text2text-generation").assert_any_call(
        "WWII ended in 1945.", max_new_tokens=64, num_beams=4, do_sample=False
    )


def test_generate_flashcards_advanced_no_questions_generated(mock_pipelines):
    # Mock QG to return empty, and QA to return low score or empty
    mock_qg = mock_pipelines.__enter__.return_value.side_effect("text2text-generation")
    mock_qg.return_value = [] # No questions from QG

    mock_qa = mock_pipelines.__enter__.return_value.side_effect("question-answering")
    mock_qa.return_value = {'answer': '', 'score': 0.01} # Low score answers

    # Mock SpaCy to return no entities for entity-based fallback
    mock_doc = MagicMock()
    mock_doc.sents = [MagicMock(text="A simple sentence.")]
    mock_doc.ents = []
    mock_pipelines.__enter__.return_value.side_effect("spacy").load.return_value.return_value = mock_doc

    context = "This is a very generic text with no specific entities or clear questions."
    num_questions = 1

    flashcards = generate_flashcards_advanced(context, num_questions)
    
    assert len(flashcards) == 1
    assert flashcards[0]["question"] == "AI could not generate specific flashcards."
    assert "Please provide more detailed or structured notes." in flashcards[0]["answer"]
