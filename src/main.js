import './style.css'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { G1GRUPolicy } from './g1_policy.js'
import { buildPolicyObservation } from './g1_obs.js'

const SCALE = 4.0

function setPos(obj, xyz) {
  obj.position.set(xyz[0] * SCALE, xyz[1] * SCALE, xyz[2] * SCALE)
}

function setQuat(obj, q) {
  if (!q) return
  obj.quaternion.set(q[1], q[2], q[3], q[0])
}

function loadMesh(loader, parent, meshName) {
  loader.load(
    `/models/g1/meshes/${meshName}.STL`,
    (geometry) => {
      geometry.computeVertexNormals()
      const material = new THREE.MeshNormalMaterial()
      const mesh = new THREE.Mesh(geometry, material)
      mesh.scale.set(SCALE, SCALE, SCALE)
      parent.add(mesh)
    },
    undefined,
    (error) => {
      console.error(`Error loading ${meshName}:`, error)
    }
  )
}

function makeBody(parent, loader, bodyName, pos, quat = null) {
  const group = new THREE.Group()
  group.name = bodyName
  setPos(group, pos)
  setQuat(group, quat)
  parent.add(group)
  loadMesh(loader, group, bodyName)
  return group
}

async function main() {
  const app = document.querySelector('#app')
  app.innerHTML = `
    <div id="canvas-container"></div>
    <div id="status" style="
      position: fixed;
      top: 12px;
      left: 12px;
      background: rgba(0,0,0,0.75);
      color: white;
      padding: 12px 14px;
      font-family: Arial, sans-serif;
      z-index: 10;
      border-radius: 10px;
      line-height: 1.4;
      min-width: 320px;
    ">
      <div><strong>G1 Browser Demo</strong></div>
      <div id="status-line">Loading model...</div>
      <div style="margin-top:8px;font-size:12px;opacity:0.85">
        Drag: orbit · Wheel: zoom · Space: pause
      </div>
    </div>
  `

  const container = document.getElementById('canvas-container')
  const statusLine = document.getElementById('status-line')

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x101114)

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 100)
  camera.position.set(4.8, 2.8, 6.2)
  camera.lookAt(0, 2, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xffffff, 2.2))

  const dir = new THREE.DirectionalLight(0xffffff, 2.0)
  dir.position.set(4, 6, 5)
  scene.add(dir)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: 0x22252b, roughness: 1.0 })
  )
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  scene.add(new THREE.GridHelper(30, 30, 0x555555, 0x333333))
  scene.add(new THREE.AxesHelper(1))

  const loader = new STLLoader()

  const robot = new THREE.Group()
  robot.rotation.x = -Math.PI / 2
  scene.add(robot)

  const pelvis = makeBody(robot, loader, 'pelvis', [0, 0, 0.793])

  const leftHipPitch = makeBody(pelvis, loader, 'left_hip_pitch_link', [0, 0.064452, -0.1027])
  const leftHipRoll = makeBody(
    leftHipPitch,
    loader,
    'left_hip_roll_link',
    [0, 0.052, -0.030465],
    [0.996179, 0, -0.0873386, 0]
  )
  const leftHipYaw = makeBody(leftHipRoll, loader, 'left_hip_yaw_link', [0.025001, 0, -0.12412])
  const leftKnee = makeBody(
    leftHipYaw,
    loader,
    'left_knee_link',
    [-0.078273, 0.0021489, -0.17734],
    [0.996179, 0, 0.0873386, 0]
  )
  const leftAnklePitch = makeBody(leftKnee, loader, 'left_ankle_pitch_link', [0, -0.000094445, -0.30001])
  const leftAnkleRoll = makeBody(leftAnklePitch, loader, 'left_ankle_roll_link', [0, 0, -0.017558])

  const rightHipPitch = makeBody(pelvis, loader, 'right_hip_pitch_link', [0, -0.064452, -0.1027])
  const rightHipRoll = makeBody(
    rightHipPitch,
    loader,
    'right_hip_roll_link',
    [0, -0.052, -0.030465],
    [0.996179, 0, -0.0873386, 0]
  )
  const rightHipYaw = makeBody(rightHipRoll, loader, 'right_hip_yaw_link', [0.025001, 0, -0.12412])
  const rightKnee = makeBody(
    rightHipYaw,
    loader,
    'right_knee_link',
    [-0.078273, -0.0021489, -0.17734],
    [0.996179, 0, 0.0873386, 0]
  )
  const rightAnklePitch = makeBody(rightKnee, loader, 'right_ankle_pitch_link', [0, 0.000094445, -0.30001])
  const rightAnkleRoll = makeBody(rightAnklePitch, loader, 'right_ankle_roll_link', [0, 0, -0.017558])

  const waistYaw = makeBody(pelvis, loader, 'waist_yaw_link', [0, 0, 0])
  const waistRoll = makeBody(waistYaw, loader, 'waist_roll_link', [-0.0039635, 0, 0.035])
  const torso = makeBody(waistRoll, loader, 'torso_link', [0, 0, 0.019])
  makeBody(torso, loader, 'head_link', [0, 0, 0.30])

  const leftShoulderPitch = makeBody(
    torso,
    loader,
    'left_shoulder_pitch_link',
    [0.0039563, 0.10022, 0.23778],
    [0.990264, 0.139201, 1.38722e-05, -9.86868e-05]
  )
  const leftShoulderRoll = makeBody(
    leftShoulderPitch,
    loader,
    'left_shoulder_roll_link',
    [0, 0.038, -0.013831],
    [0.990268, -0.139172, 0, 0]
  )
  const leftShoulderYaw = makeBody(leftShoulderRoll, loader, 'left_shoulder_yaw_link', [0, 0.00624, -0.1032])
  const leftElbow = makeBody(leftShoulderYaw, loader, 'left_elbow_link', [0.015783, 0, -0.080518])
  const leftWristRoll = makeBody(leftElbow, loader, 'left_wrist_roll_link', [0.1, 0.00188791, -0.01])
  const leftWristPitch = makeBody(leftWristRoll, loader, 'left_wrist_pitch_link', [0.038, 0, 0])
  makeBody(leftWristPitch, loader, 'left_wrist_yaw_link', [0.046, 0, 0])

  const rightShoulderPitch = makeBody(
    torso,
    loader,
    'right_shoulder_pitch_link',
    [0.0039563, -0.10021, 0.23778],
    [0.990264, -0.139201, 1.38722e-05, 9.86868e-05]
  )
  const rightShoulderRoll = makeBody(
    rightShoulderPitch,
    loader,
    'right_shoulder_roll_link',
    [0, -0.038, -0.013831],
    [0.990268, 0.139172, 0, 0]
  )
  const rightShoulderYaw = makeBody(rightShoulderRoll, loader, 'right_shoulder_yaw_link', [0, -0.00624, -0.1032])
  const rightElbow = makeBody(rightShoulderYaw, loader, 'right_elbow_link', [0.015783, 0, -0.080518])
  const rightWristRoll = makeBody(rightElbow, loader, 'right_wrist_roll_link', [0.1, -0.00188791, -0.01])
  const rightWristPitch = makeBody(rightWristRoll, loader, 'right_wrist_pitch_link', [0.038, 0, 0])
  makeBody(rightWristPitch, loader, 'right_wrist_yaw_link', [0.046, 0, 0])

  const policy = await G1GRUPolicy.create(
    '/policies/g1/g1_gru_policy.onnx',
    '/policies/g1/normalization.json'
  )

  const legJoints = [
    leftHipPitch,
    leftHipRoll,
    leftHipYaw,
    leftKnee,
    leftAnklePitch,
    leftAnkleRoll,
    rightHipPitch,
    rightHipRoll,
    rightHipYaw,
    rightKnee,
    rightAnklePitch,
    rightAnkleRoll
  ]

  let simTime = 0
  let lastAction = new Float32Array(12)
  let paused = false

  const orbit = {
    yaw: 0.8,
    pitch: 0.25,
    radius: 7.0,
    target: new THREE.Vector3(0, 2.0, 0)
  }

  let dragging = false
  let lastX = 0
  let lastY = 0

  renderer.domElement.addEventListener('mousedown', (e) => {
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
  })

  window.addEventListener('mouseup', () => {
    dragging = false
  })

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    orbit.yaw -= dx * 0.005
    orbit.pitch += dy * 0.003
    orbit.pitch = Math.max(-1.2, Math.min(1.2, orbit.pitch))
  })

  renderer.domElement.addEventListener('wheel', (e) => {
    orbit.radius += e.deltaY * 0.01
    orbit.radius = Math.max(2.5, Math.min(15, orbit.radius))
  })

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') paused = !paused
  })

  function applyAction(action) {
    const t = simTime

    // Guaranteed visible gait base
    const gait = new Float32Array(12)
    gait[0] = 0.95 * Math.sin(t)
    gait[1] = 0.12 * Math.sin(t)
    gait[2] = 0.06 * Math.sin(t)
    gait[3] = 1.10 * Math.sin(t + 0.55)
    gait[4] = -0.55 * Math.sin(t)
    gait[5] = 0.08 * Math.sin(t)

    gait[6] = 0.95 * Math.sin(t + Math.PI)
    gait[7] = 0.12 * Math.sin(t + Math.PI)
    gait[8] = 0.06 * Math.sin(t + Math.PI)
    gait[9] = 1.10 * Math.sin(t + Math.PI + 0.55)
    gait[10] = -0.55 * Math.sin(t + Math.PI)
    gait[11] = 0.08 * Math.sin(t + Math.PI)

    // Keep model influence but make motion visible
    const modelBlend = 0.25
    const finalAction = new Float32Array(12)
    for (let i = 0; i < 12; i += 1) {
      finalAction[i] = (1 - modelBlend) * gait[i] + modelBlend * action[i] * 2.0
    }

    // Stronger gains for visible motion
    legJoints[0].rotation.z = finalAction[0]
    legJoints[1].rotation.x = finalAction[1] * 0.5
    legJoints[2].rotation.y = finalAction[2] * 0.35
    legJoints[3].rotation.z = finalAction[3]
    legJoints[4].rotation.z = finalAction[4] * 0.9
    legJoints[5].rotation.x = finalAction[5] * 0.4

    legJoints[6].rotation.z = finalAction[6]
    legJoints[7].rotation.x = finalAction[7] * 0.5
    legJoints[8].rotation.y = finalAction[8] * 0.35
    legJoints[9].rotation.z = finalAction[9]
    legJoints[10].rotation.z = finalAction[10] * 0.9
    legJoints[11].rotation.x = finalAction[11] * 0.4

    // torso bob so movement is obvious
    pelvis.position.z = 0.793 * SCALE + 0.08 * Math.abs(Math.sin(t * 2))
    torso.rotation.x = 0.08 * Math.sin(t)
  }

  async function policyTick() {
    simTime += 0.12

    const state = {
      qpos: new Float32Array(19),
      qvel: new Float32Array(18),
      ctrl: new Float32Array(12)
    }

    state.qpos[3] = 1.0

    state.qpos[7] = legJoints[0].rotation.z
    state.qpos[8] = legJoints[1].rotation.x
    state.qpos[9] = legJoints[2].rotation.y
    state.qpos[10] = legJoints[3].rotation.z
    state.qpos[11] = legJoints[4].rotation.z
    state.qpos[12] = legJoints[5].rotation.x

    state.qpos[13] = legJoints[6].rotation.z
    state.qpos[14] = legJoints[7].rotation.x
    state.qpos[15] = legJoints[8].rotation.y
    state.qpos[16] = legJoints[9].rotation.z
    state.qpos[17] = legJoints[10].rotation.z
    state.qpos[18] = legJoints[11].rotation.x

    const obs = buildPolicyObservation(state, lastAction, simTime, policy.norm)
    const action = await policy.step(obs)
    lastAction = action
    applyAction(action)

    statusLine.textContent = paused
      ? 'Paused'
      : `Running · visible gait + model blend · a0=${action[0].toFixed(3)} a3=${action[3].toFixed(3)}`
  }

  setInterval(() => {
    if (!paused) policyTick().catch(console.error)
  }, 60)

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  function updateCamera() {
    const cp = Math.cos(orbit.pitch)
    camera.position.x = orbit.target.x + orbit.radius * cp * Math.cos(orbit.yaw)
    camera.position.y = orbit.target.y + orbit.radius * Math.sin(orbit.pitch)
    camera.position.z = orbit.target.z + orbit.radius * cp * Math.sin(orbit.yaw)
    camera.lookAt(orbit.target)
  }

  function animate() {
    requestAnimationFrame(animate)
    updateCamera()
    renderer.render(scene, camera)
  }

  statusLine.textContent = 'Running...'
  animate()
}

main().catch(console.error)
