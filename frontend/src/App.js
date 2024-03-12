import React from 'react';
import styles from './App.css';

function App() {
    return (
        <div className={styles.header}>
            <div className={styles.frameContainer}>
                <h1 className={styles.overcut}>Overcut</h1>
            </div>
            <header className={styles.headerFrameset}>
                <div className={styles.subFrameset}>
                    <div className={styles.shop}>Shop</div>
                </div>
                <div className={styles.subFrameset1}>
                    <div className={styles.newstand}>Newstand</div>
                </div>
                <div className={styles.subFrameset2}>
                    <div className={styles.whoWeAre}>Who we are</div>
                </div>
                <div className={styles.subFrameset3}>
                    <div className={styles.myProfile}>My profile</div>
                </div>
                <button className={styles.cartButton}>
                    <div className={styles.login}>Login</div>
                </button>
            </header>
        </div>
    );
}

export default App;
