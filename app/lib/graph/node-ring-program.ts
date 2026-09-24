import { NodeCircleProgram } from "sigma/rendering";
import type { NodeLabelDrawingFunction } from "sigma/rendering";

// Same geometry as Sigma's NodeCircleProgram; the fragment shader adds a thin
// white ring so overlapping nodes stay distinct (Neo4j Bloom-style discs).
// Colors arrive premultiplied, so the ring uses vec4(alpha) as "white".
const FRAGMENT_SHADER_SOURCE = /* glsl */ `
precision highp float;

varying vec4 v_color;
varying vec2 v_diffVector;
varying float v_radius;

uniform float u_correctionRatio;

const vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);

void main(void) {
  float dist = length(v_diffVector);

  #ifdef PICKING_MODE
  if (dist > v_radius)
    gl_FragColor = transparent;
  else
    gl_FragColor = v_color;
  #else
  float aa = u_correctionRatio * 1.5;
  float ring = min(u_correctionRatio * 1.8, v_radius * 0.3);
  vec4 white = vec4(v_color.a);
  float innerT = smoothstep(v_radius - ring - aa, v_radius - ring, dist);
  float outerT = smoothstep(v_radius - aa, v_radius, dist);
  gl_FragColor = mix(mix(v_color, white, innerT), transparent, outerT);
  #endif
}
`;

export class NodeRingProgram extends NodeCircleProgram {
  getDefinition() {
    return { ...super.getDefinition(), FRAGMENT_SHADER_SOURCE };
  }
}

/** Centered label below the node with a white halo, readable over edges. */
export const drawLabelBelow: NodeLabelDrawingFunction = (context, data, settings) => {
  if (!data.label) return;
  const size = settings.labelSize;
  context.font = `${settings.labelWeight} ${size}px ${settings.labelFont}`;
  context.textAlign = "center";
  context.textBaseline = "top";
  const y = data.y + data.size + 3;
  context.lineJoin = "round";
  context.lineWidth = 3.5;
  context.strokeStyle = "rgba(255, 255, 255, 0.94)";
  context.strokeText(data.label, data.x, y);
  context.fillStyle = settings.labelColor.color ?? "#1b2420";
  context.fillText(data.label, data.x, y);
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
};
