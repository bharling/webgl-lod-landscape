webgl-lod-landscape
===================

Three.js Infinite Landscape Engine

This is a WebGL / HTML5 / Three.js port of a simple High Detail Terrain implementation from 

http://blenderartists.org/forum/showthread.php?256768-Terrrain-LOD-huge-open-world-for-all-(glsl-custom-shader)

Requires:
=========

Three.js
GPU Capable of vertex shader texture fetch operations.


credit for shaders / textures goes to the author at the link above

Status
======

I've slightly enhanced the above code by adding routines to automatically generate the LOD mesh in Three.js, and am currently trying to implement 'skirts' to hide the gaps between LOD levels. As will become obvious when viewing the demo, this is not finished yet. any help is more than welcome!


