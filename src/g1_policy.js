import * as ort from "onnxruntime-web";

function toFloat32Array(x) {
  return x instanceof Float32Array ? x : new Float32Array(x);
}

export async function loadNormalization(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load normalization JSON: ${url}`);
  }

  const norm = await res.json();

  return {
    x_mean: toFloat32Array(norm.x_mean),
    x_std: toFloat32Array(norm.x_std),
    obs_cols: norm.obs_cols,
    act_cols: norm.act_cols,
    seq_len: Array.isArray(norm.seq_len) ? norm.seq_len[0] : norm.seq_len,
    hidden: Array.isArray(norm.hidden) ? norm.hidden[0] : norm.hidden,
    layers: Array.isArray(norm.layers) ? norm.layers[0] : norm.layers,
  };
}

export class G1GRUPolicy {
  constructor(session, norm) {
    this.session = session;
    this.norm = norm;
    this.hidden = new Float32Array(norm.layers * norm.hidden);
    this.lastAction = new Float32Array(12);
  }

  static async create(onnxUrl, normUrl) {
    const norm = await loadNormalization(normUrl);

    const session = await ort.InferenceSession.create(onnxUrl, {
      executionProviders: ["wasm"],
    });

    return new G1GRUPolicy(session, norm);
  }

  reset() {
    this.hidden.fill(0);
    this.lastAction.fill(0);
  }

  async step(obs47) {
    const obsTensor = new ort.Tensor("float32", obs47, [1, 1, 47]);
    const hiddenTensor = new ort.Tensor(
      "float32",
      this.hidden,
      [this.norm.layers, 1, this.norm.hidden],
    );

    const outputs = await this.session.run({
      obs: obsTensor,
      hidden_in: hiddenTensor,
    });

    const action = outputs.action.data;
    const hiddenOut = outputs.hidden_out.data;

    this.hidden.set(hiddenOut);

    const out = new Float32Array(12);
    for (let i = 0; i < 12; i += 1) {
      out[i] = action[i];
    }

    this.lastAction.set(out);
    return out;
  }
}
