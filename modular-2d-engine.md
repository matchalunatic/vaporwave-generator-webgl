# Design of a modular 2D art engine, like a virtual analog video synth

## Render

the target output may be of two types:

- vector
- raster

Vector outputs possess the following instructions:

- set phosphor decay time (the "disintegration constant" of phosphors, how long phosphors decay according to an exponential law, from a given energy level to a residual energy level)
- set beam power: define exciter beam intensity from 0% to 100%
- move beam: move beam from its current position to its next position, linearly, in a cartesian system
- move beam Bézier N: move beam according to a Bézier curve with N points starting from the current position and ending at the Nth point, in a cartesian system
- move beam in a polar system: move beam to another position in a polar system, varying angle and radius on 2 [0, 1] gradients
- blank screen: force all phosphors to lose their energy very fast (instantaneously)

Raster outputs are driven like a CRT, they obey clock modeline parameters and are driven by a composite, component or RGB signal:

- RGB is RGBHV
- Component is Y Cb Cr or YUV
- Composite is (NTSC) CVBS with or without luma signals (without luma signals it will be monochromatic)

In our system, the outputs are rendered into digital higher-resolution bitplanes that may be displayed or conveyed to other systems. Outputs may also be stacked and merged.

## Geometries

Geometries are objects designed to be rendered on a vector display

## Filters

Filters are transformations applied to a raster output. For example, they could set a hue to a signal, reduce intensity, 
