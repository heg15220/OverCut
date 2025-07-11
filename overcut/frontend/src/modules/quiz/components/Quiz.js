import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../actions';
import { FormattedMessage } from 'react-intl';
import * as UserSelector from '../../users/selectors';
import { useNavigate } from 'react-router-dom';
import './quizStyles.css';
import { motion } from 'framer-motion';
import { sourceImages } from '../../../helpers/sourceImages';
import GameCooldownScreen from '../../cooldown/components/GameCooldownScreen';
import { fetchCooldown } from "../../cooldown/actions";
import { getCooldownForGame } from "../../cooldown/selectors";
import { getUser } from "../../users/selectors";
import QuizLoadingScreen from '../../common/components/QuizLoadingScreen';

const backgroundImages = [
    './f1-2013-11-bel-parrilla-trasera.png',
    './salida-gp-bahrein-2024-f1.png',
    './mundial-f1.png'
];

const Quiz = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(UserSelector.getUser);
    const [loading, setLoading] = useState(false);
    const [bgIndex, setBgIndex] = useState(0);
    const [prevBgIndex, setPrevBgIndex] = useState(null);
    const [quizCooldown, setQuizCooldown] = useState(null);
    const lang = navigator.language.startsWith('es') ? 'es' : 'en';
    const { canPlay, secondsRemaining, loading: cooldownLoading  } = useSelector(state =>
      getCooldownForGame(state, "Quiz")
    );



    useEffect(() => {
        const interval = setInterval(() => {
            setPrevBgIndex(bgIndex);
            setBgIndex((prev) => (prev + 1) % backgroundImages.length);
        }, 8000);

        return () => clearInterval(interval);
    }, [bgIndex]);

    useEffect(() => {
      dispatch(fetchCooldown("Quiz"));
    }, [dispatch]);

    const handleStart = () => {
        if (!canPlay || cooldownLoading) return;
        if (user.id) {
            const rawLang = navigator.language || navigator.userLanguage;
            const normalizedLang = rawLang.toLowerCase().startsWith('es') ? 'es' : 'en';

            setLoading(true);
            dispatch(actions.createQuiz({
                userId: user.id,
                lang: normalizedLang,
                onSuccess: (quizId) => navigate(`/quiz/quiz-list/${quizId}`),
                onCooldown: (secondsRemaining) => {
                    setLoading(false);
                    setQuizCooldown(secondsRemaining);
                },
                onErrors: () => setLoading(false)
            }));

        }
    };


    if (cooldownLoading) {
      return <QuizLoadingScreen lang={lang} />;
    }



    if (!canPlay) {
      return (
        <GameCooldownScreen
          seconds={secondsRemaining}
          onBack={() => navigate("/")}
        />
      );
    }


    if (quizCooldown !== null) {
      return (
        <GameCooldownScreen
          seconds={quizCooldown}
          loading={loading}
          onBack={() => navigate("/")}
        />
      );
    }



    return (
        <div className="quiz-container">
               {/* Imagen anterior con degradado y desvanecimiento suave */}
                {prevBgIndex !== null && (
                    <motion.div
                        key={`prev-${prevBgIndex}`}
                        className="background-image"
                        initial={{ opacity: 1, scale: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ opacity: { duration: 2.5 } }}
                        style={{
                            backgroundImage: `url(${sourceImages(backgroundImages[prevBgIndex])})`,
                            zIndex: 0
                        }}
                    />
                )}

                {/* Imagen actual con zoom progresivo y fade in suave */}
                <motion.div
                    key={`current-${bgIndex}`}
                    className="background-image"
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ opacity: 1, scale: 1.05 }}
                    transition={{
                        opacity: { duration: 2 },
                        scale: { duration: 15, ease: "easeInOut" }
                    }}
                    style={{
                        backgroundImage: `url(${sourceImages(backgroundImages[bgIndex])})`,
                        zIndex: 1
                    }}
                />

            <div className="overlay" />
            <div className="quiz-content">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="loading-spinner"
                    >
                        <motion.div
                            className="spinner-wheel"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        />
                        <p style={{ marginTop: '1rem', color: 'white', fontSize: '1.2rem' }}>
                            <FormattedMessage id="quiz.loading" />
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="intro-card"
                    >
                        <h1 className="question-title"><FormattedMessage id="quiz.intro.title" /></h1>
                        <p style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '2rem' }}>
                            <FormattedMessage id="quiz.intro.subtitle" />
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="quiz-answer-btn"
                            onClick={handleStart}
                        >
                            <FormattedMessage id="quiz.intro.play" />
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Quiz;