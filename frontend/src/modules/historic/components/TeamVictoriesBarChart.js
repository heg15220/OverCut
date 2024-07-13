import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bar } from 'react-chartjs-2';
import * as actions from "../actions";
import * as selectors from "../selectors";

import { Chart, registerables} from 'chart.js';

Chart.register(...registerables);
const TeamVictoriesBarChart = () => {
    const dispatch = useDispatch();
    const circuitVictories = useSelector(selectors.getVictoriesByTeam);
    const isLoading = useSelector(state => state.isLoading);
    const [chartInstance, setChartInstance] = useState(null);
    const [chartData, setChartData] = useState({});

    useEffect(() => {
        dispatch(actions.getTeamVictoriesCount(() => {}));
    }, [dispatch]);

    useEffect(() => {
        if (circuitVictories) {
            const data = {
                labels: Object.keys(circuitVictories),
                datasets: [
                    {
                        label: 'Victorias por Circuito',
                        data: Object.values(circuitVictories),
                        backgroundColor: 'rgba(75,192,192,0.6)',
                        borderColor: 'rgba(75,192,192,1)',
                        borderWidth: 1
                    }
                ]
            };
            setChartData(data);
        }
    }, [circuitVictories]);

    const options = {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    if (isLoading || !Object.keys(circuitVictories).length) {
        return <div>Loading...</div>;
    }

    const handleRenderChart = (instance) => {
        setChartInstance(instance);
    };

    // Comprueba que chartData no sea un objeto vacío antes de renderizar la gráfica
    return (
        <div>
            {Object.keys(chartData).length > 0 && (
                <Bar data={chartData} options={options} onElementsCreate={handleRenderChart} />
            )}
        </div>
    );
};

export default TeamVictoriesBarChart;
