Original prompt: Siguiente paso, el texto de la narrativa de la carrera en la simulación en la vista de móvil se ve demasiado grande la letra. Por otro lado, para OverCutRacing no implementaste las vistas personalizadas para los dispositivos de tipo tablet.

Notes:
- OverCutRacing responsive CSS currently has generic max-width 1050px and mobile max-width 720px rules.
- Need smaller race narrative text on mobile and a tablet-specific layout for 721px-1050px.
- Added tablet-specific 721px-1050px CSS with a two-column draft/season layout and adjusted tablet typography.
- Reduced mobile simulation/result narrative text sizing and compacted simulation spacing.
