import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie, Sector, LabelList, RadialBarChart, RadialBar
} from 'recharts';
import * as actions from "../actions";
import * as selectors from "../selectors";
import {FormattedMessage} from "react-intl";
import {Typography} from "@mui/material";


const rankingData = [
    { name: 'Lewis Hamilton', score: 200 },
    { name: 'Michael Schumacher', score: 155 },
    { name: 'Sebastian Vettel', score: 122 },
    { name: 'Max Verstappen', score: 108 },
    { name: 'Alain Prost', score: 106 },
    { name: 'Fernando Alonso', score: 106 },
    { name: 'Kimi Raikkonen', score: 103 },
    { name: 'Ayrton Senna', score: 80 },
    { name: 'Ruben Barrichello', score: 68 },
    { name: 'Valtteri Bottas', score: 67 },
    // Agrega más equipos según sea necesario
];

const rankingWins = [
    { name: 'Lewis Hamilton', score: 104 },
    { name: 'Michael Schumacher', score: 91 },
    { name: 'Max Verstappen', score: 61 },
    { name: 'Sebastian Vettel', score: 53 },
    { name: 'Alain Prost', score: 51 },
    { name: 'Ayrton Senna', score: 41 },
    { name: 'Fernando Alonso', score: 32 },
    { name: 'Nigel Mansell', score: 31 },
    { name: 'Jackie Stewart', score: 27 },
    { name: 'Jim Clark', score: 25 },
    // Agrega más equipos según sea necesario
];

const data = [
    { name: 'Michael Schumacher', championships: 7 },
    { name: 'Lewis Hamilton', championships: 7 },
    { name: 'Juan Manuel Fangio', championships: 5 },
    { name: 'Alain Prost', championships: 4 },
    { name: 'Sebastian Vettel', championships: 4 },
    { name: 'Jack Brabham', championships: 3 },
    { name: 'Jackie Stewart', championships: 3 },
    { name: 'Niki Lauda', championships: 3 },
    { name: 'Nelson Piquet', championships: 3 },
    { name: 'Ayrton Senna', championships: 3 },
    { name: 'Max Verstappen', championships: 3 },
];

// Ordena tus datos por el puntaje en orden descendente
rankingData.sort((a, b) => b.score - a.score);

const CustomizedTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip" style={{ backgroundColor: '#ffff', padding: '5px', border: '1px solid #cccc' }}>
                <p className="label">{`${label} : ${payload[0].value}`}</p>
            </div>
        );
    }

    return null;
};


const TeamVictoriesBarChart = () => {
    const dispatch = useDispatch();
    const circuitVictories = useSelector(selectors.getVictoriesByTeam);
    const victoriesPerCircuitAndTeam = useSelector(selectors.getVictoriesPerCircuitAndTeam);
    const isLoading = useSelector(state => state.isLoading);

    useEffect(() => {
        dispatch(actions.getTeamVictoriesCount(() => {}));
    }, [dispatch]);

    useEffect(() => {
        dispatch(actions.getVictoriesPerCircuitAndTeam(() => {}));
    }, [dispatch]);

    if (isLoading || !circuitVictories?.existMoreItems || !victoriesPerCircuitAndTeam) {
        return <div>Loading...</div>;
    }


    // Transforma los datos para la gráfica de barras
    const barChartData = circuitVictories.items.reduce((acc, curr) => {
        Object.entries(curr).forEach(([team, victories]) => {
            acc.push({ name: team, victories });
        });
        return acc;
    }, []);
    const colors = [
        '#FF0000', '#800000', '#FFFF00', '#808000', '#008000', '#004000',
        '#0000FF', '#000080', '#00FFFF', '#008080', '#000088', '#FF00FF', '#800080',
        '#FFFFCC', '#808080', '#00BFFF', '#008080', '#FFD700', '#ADFF2F'
    ];



    // Transforma los datos para la gráfica circular
    const pieChartData = victoriesPerCircuitAndTeam.items.reduce((acc, curr) => {
        // Convierte circuitId a String y victories a Number
        const circuitIdStr = String(curr.circuitId);
        const victoriesNum = Number(curr.victories);

        // Comprueba si el equipo ya existe en el acumulador
        if (!acc[curr.teamWinner]) {
            acc[curr.teamWinner] = { name: curr.teamWinner, totalVictories: 0 };
        }

        // Suma las victorias del equipo
        acc[curr.teamWinner].totalVictories += victoriesNum;

        return acc;
    }, {});



    // Genera un array de objetos para el gráfico circular
    const pieData = Object.keys(pieChartData).map(key => ({
        name: key,
        value: pieChartData[key].totalVictories
    }));

    return (
        <>
            <Typography variant="body2" color="text.secondary" sx={{
                fontSize: '1.2rem', // Ajusta el tamaño de la fuente
                fontStyle: 'italic', // Aplica estilo cursiva
                fontWeight: 'bold', // Aplica negrita
                color: '#333333', // Color de texto blanco
                padding: '5px', // Espaciado interno
                borderRadius: '5px', // Bordes redondeados
                marginBottom: '10px', // Espacio debajo para separar del siguiente elemento
                maxWidth: 'auto', // Permite que el ancho se adapte al contenido
                display: 'inline-block', // Hace que el componente se ajuste al contenido
                marginX: 'auto', // Centra horizontalmente el componente
            }}>
                <FormattedMessage id="project.entities.stats.teams.wins"></FormattedMessage>
            </Typography>

            {/* Tu gráfica de barras existente */}
            <BarChart
                width={900}
                height={300}
                data={barChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="victories" fill="#8884d8">
                    {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Bar>
            </BarChart>


            {/* Gráfica circular */}
            <PieChart width={800} height={400}>
                <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(2)}%`}
                    outerRadius={170}
                    fill="#8884d8"
                >
                    <Sector
                        startAngle={90}
                        endAngle={(360 / pieData.length) + 90}
                        innerRadius={80}
                        fill="#82ca9d"
                    />
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
            <Typography variant="body2" color="text.secondary" sx={{
                fontSize: '1.2rem', // Ajusta el tamaño de la fuente
                fontStyle: 'italic', // Aplica estilo cursiva
                fontWeight: 'bold', // Aplica negrita
                color: '#333333', // Color de texto blanco
                padding: '5px', // Espaciado interno
                borderRadius: '5px', // Bordes redondeados
                marginBottom: '10px', // Espacio debajo para separar del siguiente elemento
                maxWidth: 'auto', // Permite que el ancho se adapte al contenido
                display: 'inline-block', // Hace que el componente se ajuste al contenido
                marginX: 'auto', // Centra horizontalmente el componente
            }}>

            <FormattedMessage id="project.entities.stats.drivers.podiums"></FormattedMessage>
            </Typography>
            <BarChart
                width={1500}
                height={300}
                data={rankingData}
                margin={{
                    top: 5, right: 30, left: 20, bottom: 5,
                }}
                barSize={20}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} allowDuplicatedCategory={true} />
                <YAxis orientation="right" />
                <LabelList position="top" />
                <Tooltip content={<CustomizedTooltip />} />
                <Legend />
                <Bar dataKey="score" fill="#8884d8">
                    {rankingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Bar>
            </BarChart>
            <Typography variant="body2" color="text.secondary" sx={{
                fontSize: '1.2rem', // Ajusta el tamaño de la fuente
                fontStyle: 'italic', // Aplica estilo cursiva
                fontWeight: 'bold', // Aplica negrita
                color: '#333333', // Color de texto blanco
                padding: '5px', // Espaciado interno
                borderRadius: '5px', // Bordes redondeados
                marginBottom: '10px', // Espacio debajo para separar del siguiente elemento
                maxWidth: 'auto', // Permite que el ancho se adapte al contenido
                display: 'inline-block', // Hace que el componente se ajuste al contenido
                marginX: 'auto', // Centra horizontalmente el componente
            }}>

            <FormattedMessage id="project.entities.stats.drivers.wins"></FormattedMessage>
            </Typography>
            <BarChart
                width={1500}
                height={300}
                data={rankingWins}
                margin={{
                    top: 5, right: 30, left: 20, bottom: 5,
                }}
                barSize={20}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} allowDuplicatedCategory={true} />
                <YAxis orientation="left" /> {/* Cambia la orientación del eje Y a "left" */}
                <LabelList position="bottom" /> {/* Ajusta la posición de las etiquetas para que coincida con la nueva orientación del eje Y */}
                <Tooltip content={<CustomizedTooltip />} />
                <Legend />
                <Bar dataKey="score" fill="#8884d8">
                    {rankingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Bar>
            </BarChart>

            <Typography variant="body2" color="text.secondary" sx={{
                fontSize: '1.2rem', // Ajusta el tamaño de la fuente
                fontStyle: 'italic', // Aplica estilo cursiva
                fontWeight: 'bold', // Aplica negrita
                color: '#333333', // Color de texto blanco
                padding: '5px', // Espaciado interno
                borderRadius: '5px', // Bordes redondeados
                marginBottom: '10px', // Espacio debajo para separar del siguiente elemento
                maxWidth: 'auto', // Permite que el ancho se adapte al contenido
                display: 'inline-block', // Hace que el componente se ajuste al contenido
                marginX: 'auto', // Centra horizontalmente el componente
            }}>
            <FormattedMessage id="project.entities.stats.drivers.championships"></FormattedMessage>
            </Typography>
            <BarChart width={1200} height={400} data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="championships">
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Bar>
            </BarChart>



        </>
    );
};

export default TeamVictoriesBarChart;
