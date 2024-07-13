import React, { useEffect } from 'react'; // Solo necesitas useEffect si no usas useState
import { useDispatch, useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import * as actions from "../actions";
import * as selectors from "../selectors";

const TeamVictoriesBarChart = () => {
    const dispatch = useDispatch();
    const circuitVictories = useSelector(selectors.getVictoriesByTeam);
    const isLoading = useSelector(state => state.isLoading);

    useEffect(() => {
        dispatch(actions.getTeamVictoriesCount(() => {}));
    }, [dispatch]);

    if (isLoading || !circuitVictories.existMoreItems) {
        return <div>Loading...</div>;
    }

    // Transforma los datos para la gráfica
    const transformedData = circuitVictories.items.reduce((acc, curr) => {
        Object.entries(curr).forEach(([team, victories]) => {
            acc.push({ name: team, victories });
        });
        return acc;
    }, []);

    return (
        <BarChart
            width={500}
            height={300}
            data={transformedData}
            margin={{
                top: 20, right: 30, left: 20, bottom: 5,
            }}
        >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="victories" fill="#8884d8">
                <Cell fill="#8884d8" />
            </Bar>
        </BarChart>
    );
};

export default TeamVictoriesBarChart;
