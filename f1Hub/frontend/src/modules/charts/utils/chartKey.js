export const buildChartKey = (endpoint, params) => {
  const validParams = ["driverId", "constructorId", "season"] // ← sin limit
    .map(key => params?.[key])
    .filter(val => val !== "" && val !== undefined && val !== null);

  return validParams.length > 0
    ? `${endpoint}:${validParams.join(":")}`
    : endpoint;
};
