# Vsynth in WebGL

## Design

Mostly, [modular-2d-engine.md](../modular-2d-engine.md) is the inspiration.

Objects are shaders with Attributes, and thus may vary as time goes.

Objects will be designed so that a change in parameter makes them evolve, so that they have a state and change from one state to the next in a controlled way. This means that for a given state at time T, a change in parameters will not cause a reset at T+1.

## CRT and Vector rendering

We cannot output video signals and render them on screen efficiently, it takes too much processing power. In the future we may want to write a FPGA program to generate composite / component / rgbhv output if we want, it could also be possible to record it in advance and play it back in that case. (need to check if this exists already)

When running software-based vsynth, video output will be to a texture and then generic shaders will be applied to it to get the expected analog effects.

## Pipeline

```
Vector Primitives -> Vector transforms -> Vector merge -> Rasterization

Rasters -> Raster transforms -> Raster blend -> Output

Output -> Filter -> View
```

All objects have parameters that may be varied in time so it doesn't take a reload or rebuild to apply, making it closer to a vcv-rack like live experience.

## Communication

Objects live in shaders, they receive parameters via attributes, they write their raster outputs to textures, they write their vector outputs to ((buffers??))
API-wise, each object has a message listener and receives messages on it changing parameters, it may also setup a poller to receive continuous value changes from a given source, like what a patch cable would cause. Then, you may setup an interface over it all and stuff will happen

## Modulation

Modulation modules 

a. might be executed in shaders and write to attributes/textures to provide real-time updated data

b. might run in userspace and write to attributes like a normal parameter variation would work (safer top of my head)

# Getting there

- [X] we create a Shape object with a variable "sides (3...n)" parameter, that creates a regular (same lengths) polygon inscribed in a circle of radius 1 with as many sides as requested. The algorithm is quite easy: for a n-sided regular polygon, the first point is at cartesian coordinates (0, 1) and polar coordinates (1, 0). The second point is at polar coordinates (in degrees) (1, 360 / n ), the third point is at (1, 2 * 360 / n) and so on. this shape object defines only a mesh, no material. 
- [X] we create inside the shader an algorithm that does that taking the sides value from an attribute 
- [X] we render it and see that it works by continuously changing sides from integer values 3 to 60 and back with a quickly hacked modulator (we've done a dirty JS modulator)
- [X] we pass the output of the shape object to another Material object that will apply basic color to it: no you can't do that, it needs to plug into the Shape directly, it's the fragment shader that gives objects a color.
- [x] we implement adequate properties into the Shape objects to tweak how they render at runtime
- [x] we create a second one, with different modulators
- [x] we render both
- we create a transform shader that will take a mesh and apply a transformation matrix to it (scale and rotate) with attributes-based parameters that we may modulate
- we plug the transform shader and its modulator into our render pipeline for one of the shapes and we see that it is transformed
- we create another primitive, Grid, that generates a n x m wireframe grid
- we create a Material object that will let us define color, gradients, as functions of parameters (like time) with parameters and we create a modulator over time to evolve it
- then maybe a starfield object, scattering dot particles across a volume pseudo-randomly and setting a subjective camera in it that may slowly move with modulation parameters
- we add an infinity-echo object that takes a periodic snapshot of a texture and merges it with all previous textures, like a windows xp echo glitch https://mrdoob.com/lab/javascript/effects/ie6/x, of course the frequency and reset parameters can be modulated. we plug that into a triangle
- with all that we almost get to what vaporwave-generator does
