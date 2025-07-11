import {Grid} from "@mui/material";
import {useDispatch, useSelector} from "react-redux";
import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import * as selectors from "../selectors";
import * as actions from "../actions";
import {Pager} from "../../common";
import QuizQuestions from "./QuizQuestions";
import QuizIntroTypeCategory from './QuizIntroTypeCategory';

const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};


const QuizList = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [currentPage, setCurrentPage] = useState(0);
    const [showIntro, setShowIntro] = useState(true); // control
    const quizType = useSelector(selectors.getQuizQuestionsType);
    const quizCategory = useSelector(selectors.getQuizQuestionsCategory);
    const questions = useSelector(selectors.getQuizQuestions);
    const quiz = useSelector(selectors.findQuiz);
    const windowWidth = useWindowWidth();
    const isMobile = windowWidth < 768;


    useEffect(() => {
        if (quiz) {
            const rawLang = navigator.language || navigator.userLanguage; // fallback por compatibilidad
            const normalizedLang = rawLang.toLowerCase().startsWith('es') ? 'es' : 'en';

            dispatch(actions.getQuizQuestionsType({
                quizId: quiz,
                lang: normalizedLang,
                onSuccess: () => {},
                onErrors: () => {}
            }));

            dispatch(actions.getQuizQuestionsCategory({
                quizId: quiz,
                lang: normalizedLang,
                onSuccess: () => {},
                onErrors: () => {}
            }));
            dispatch(actions.getQuizQuestions({ quizId: quiz, page: currentPage }, () => {}, () => {}));
        }
    }, [dispatch, quiz, currentPage]);

    const handleContinue = () => {
        setShowIntro(false);
    };

    return (
      <Grid container spacing={2} justifyContent="center" alignItems="center">
        <Grid item xs={12} sm={10} md={8} lg={6} sx={{ mt: isMobile ? -4 : -8 }}>
          {showIntro ? (
            <QuizIntroTypeCategory
              quizType={quizType}
              quizCategory={quizCategory}
              onContinue={handleContinue}
            />
          ) : (
            <QuizQuestions questions={questions} quizType={quizType} />
          )}
        </Grid>
      </Grid>
    );
;
};
export default QuizList;