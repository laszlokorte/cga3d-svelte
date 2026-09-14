<script>
    import * as THREE from "three";
    import { T, useThrelte, useTask } from "@threlte/core";
    import {
        OrbitControls,
        Sky,
        TransformControls,
        Gizmo,
        useGltf,
        MeshLineGeometry,
        MeshLineMaterial,
    } from "@threlte/extras";
    import * as cga from "./cga3";
    import { generateGP } from "./cga_glsl";
    import { resolve } from "$app/paths";

    const { renderer, canvas } = useThrelte();

    const gltf = useGltf(resolve("/nike.glb")).then((m) => {
        const a = m.nodes["root"].clone(true);
        const b = m.nodes["root"].clone(true);
        a.renderOrder = 10000000;
        a.depthWrite = false;
        a.transparent = true;
        a.opacity = 1;
        b.traverse((node) => {
            node.frustumCulled = false;
            if (node.isMesh) {
                node.renderOrder = 200000;
                const material = node.material;
                material.transparent = true;
            }
        });
        a.traverse((node) => {
            node.frustumCulled = false;
            if (node.isMesh) {
                node.material = node.material.clone(true);
                node.renderOrder = 200000;
                const material = node.material;
                material.transparent = true;
                material.side = THREE.DoubleSide;

                material.onBeforeCompile = (shader) => {
                    // Add custom uniforms if needed
                    shader.uniforms.uTime = { value: 0 };
                    shader.uniforms.uMotor = { value: cga.scalar(1) };

                    // Keep a reference to uniforms if you need to update them in requestAnimationFrame
                    node.userData.shader = shader;

                    // Replace a chunk in the vertex shader
                    shader.vertexShader = shader.vertexShader
                        .replace(
                            "#include <begin_vertex>",
                            `
              #include <begin_vertex>
              // Modify transformed vertex position (e.g., wave effect)
              transformed.y += sin(position.x*40.0 + uTime * 3.0) * 0.005 + cos(position.z*15.0 + uTime * 3.0) * 0.005;
              `,
                        )
                        .replace(
                            "#include <project_vertex>",
                            `
                            MV motor;

                            for (int i = 0; i < 32; i++)
                                motor.c[i] = uMotor[i];

                            vec4 worldPos = modelMatrix * vec4(transformed, 1.0);

                            MV p = point(worldPos.xyz);

                            MV motorResult = sandwich(p, motor);

                            vec3 reflectedPos = pointCoords(motorResult);

                            worldPos = vec4(reflectedPos, 1.0);

                            vec3 worldNormal = normalize(mat3(modelMatrix) * objectNormal);
                            vec4 mvPosition = viewMatrix * worldPos;
                            gl_Position = projectionMatrix *
                                          viewMatrix *
                                          worldPos;
                            `,
                        )
                        .replace(
                            "#include <common>",
                            `
                      #include <common>

                      uniform float uTime;
                      uniform float uMotor[32];

                      ${generateGP()}

                    `,
                        );
                };
            }
        });

        return { a, b };
    });

    const { elements, motor = cga.scalar(0) } = $props();

    renderer.localClippingEnabled = true;

    let group = $state();
    let camera = $state();
    const planes = [
        new THREE.Plane(
            new THREE.Vector3(1, 0, 0), // normal
            2, // distance
        ),
        new THREE.Plane(
            new THREE.Vector3(-1, 0, 0), // normal
            2, // distance
        ),
        new THREE.Plane(
            new THREE.Vector3(0, 1, 0), // normal
            1, // distance
        ),
        new THREE.Plane(
            new THREE.Vector3(0, -1, 0), // normal
            1, // distance
        ),
        new THREE.Plane(
            new THREE.Vector3(0, 0, 1), // normal
            2, // distance
        ),
        new THREE.Plane(
            new THREE.Vector3(0, 0, -1), // normal
            2, // distance
        ),
    ];

    useTask(() => {
        if (group) {
            group.quaternion.copy(camera.quaternion).invert();
        }
    });

    export function updateViewport(c) {
        const rect = canvas.getBoundingClientRect();
        camera.setViewOffset(
            rect.width,
            rect.height,
            (rect.left - c.left) / 2,
            (rect.top - c.top) / 2,
            rect.width,
            rect.height,
        );

        camera.updateProjectionMatrix();
    }
    const points = [
        new THREE.Vector3(-2, 1, -2),
        new THREE.Vector3(2, 1, -2),
        new THREE.Vector3(2, 1, -2),
        new THREE.Vector3(2, 1, 2),
        new THREE.Vector3(2, 1, 2),
        new THREE.Vector3(-2, 1, 2),
        new THREE.Vector3(-2, 1, 2),
        new THREE.Vector3(-2, 1, -2),
        new THREE.Vector3(-2, -1, -2),
        new THREE.Vector3(-2, -1, -2),
        new THREE.Vector3(2, -1, -2),
        new THREE.Vector3(2, 1, -2),
        new THREE.Vector3(2, -1, -2),
        new THREE.Vector3(2, -1, -2),
        new THREE.Vector3(2, -1, 2),
        new THREE.Vector3(2, 1, 2),
        new THREE.Vector3(2, -1, 2),
        new THREE.Vector3(2, -1, 2),
        new THREE.Vector3(-2, -1, 2),
        new THREE.Vector3(-2, -1, 2),
        new THREE.Vector3(-2, 1, 2),
        new THREE.Vector3(-2, -1, 2),
        new THREE.Vector3(-2, -1, -2),
    ];
    const vfcount = 16 * 16 * 16;

    const vfgeometry = new THREE.CylinderGeometry(0.01, 0.01, 1, 16, 10);
    const vfmaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uMotor: { value: cga.scalar(1) },
        },

        vertexShader: /* glsl */ `
            #include <clipping_planes_pars_vertex>
               uniform float uTime;

               attribute vec3 aPosition;

               uniform float uMotor[32];

               ${generateGP()}

               void main() {
                   MV motor;

                    for (int i = 0; i < 32; i++)
                        motor.c[i] = uMotor[i];

                    MV p = point(aPosition.xyz);
                    MV motorResult = sandwich(p, motor);

                    vec4 worldPos = modelMatrix * vec4(position * vec3(1.0,0.0,1.0) + aPosition * (1.0-(2.0 * position.y + 1.0)) + (2.0 * position.y + 1.0) * pointCoords(motorResult), 1.0);
                    vec4 mvPosition = modelViewMatrix *
                       worldPos ;
                            #include <clipping_planes_vertex>

                   gl_Position = projectionMatrix * mvPosition;
               }
           `,

        fragmentShader: /* glsl */ `
               #include <clipping_planes_pars_fragment>

               void main() {
                   #include <clipping_planes_fragment>

                   gl_FragColor = vec4(1.0,0.8,0.1,1.0);
               }
           `,
    });

    const vfmesh = new THREE.InstancedMesh(vfgeometry, vfmaterial, vfcount);

    const positions = new Float32Array(vfcount * 3);

    for (let i = 0; i < vfcount; i++) {
        const x = THREE.MathUtils.randFloat(-8, 8);
        const y = THREE.MathUtils.randFloat(-8, 8);
        const z = THREE.MathUtils.randFloat(-8, 8);

        positions[i * 3 + 0] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
    }

    vfgeometry.setAttribute(
        "aPosition",
        new THREE.InstancedBufferAttribute(positions, 3),
    );

    vfmesh.instanceMatrix.needsUpdate = true;
    vfmaterial.clippingPlanes = planes;
    vfmaterial.clipping = true;
</script>

<T is={vfmesh} />

<T.PerspectiveCamera
    bind:ref={camera}
    makeDefault
    position={[5, 5, 5]}
    oncreate={(ref) => {
        ref.lookAt(0, 0, 0);
    }}
>
    <OrbitControls
        zoomSpeed={2}
        enablePan={false}
        dragToOffset={false}
        draggingSmoothTime={0.01}
        maxDistance={16}
        minDistance={2}
    >
        <Gizmo placement="top-right" />
    </OrbitControls>
    <T.Group bind:ref={group}>
        {#each [{ rot: [Math.PI / 2, 0, 0], color: "magenta" }, { rot: [0, Math.PI / 2, 0], color: "cyan" }, { rot: [0, 0, 0], color: "yellow" }] as t}
            <T.Mesh renderOrder={-1} rotation={t.rot}>
                <T.TorusGeometry args={[1, 0.001, 32, 64]} />
                <T.MeshBasicMaterial
                    toneMapped={false}
                    depthTest={false}
                    depthWrite={false}
                    color={t.color}
                />
            </T.Mesh>
        {/each}

        {#each [{ pos: [0, -10, 0], color: "green" }, { pos: [0, 10, 0], color: "green" }, { pos: [10, 0, 0], color: "red" }, { pos: [-10, 0, 0], color: "red" }, { pos: [0, 0, 10], color: "blue" }, { pos: [0, 0, -10], color: "blue" }] as { color, pos: [x, y, z] }}
            <T.Mesh renderOrder={-1} rotation={[0, 0, 0]} position={[x, y, z]}>
                <T.SphereGeometry args={[0.08, 32, 16]} />
                <T.MeshBasicMaterial
                    toneMapped={false}
                    depthTest={false}
                    depthWrite={false}
                    {color}
                />
            </T.Mesh>
        {/each}
    </T.Group>
</T.PerspectiveCamera>
<Sky renderOrder={-2} elevation={90} rayleigh={0.2} turbidity={2} />
<T.Mesh>
    <T.BoxGeometry args={[4, 2, 4]} />
    <T.MeshStandardMaterial
        toneMapped={true}
        color="#111"
        side={THREE.BackSide}
    />
</T.Mesh>
<T.Mesh renderOrder={50000}>
    <MeshLineGeometry {points} />
    <MeshLineMaterial
        width={2}
        attenuate={false}
        color="black"
        opacity={0.1}
        transparent
    />
</T.Mesh>

<T.DirectionalLight position={[3, 10, 5]} intensity={2} />
<TransformControls
    scale={5}
    position={[1, 0, 0]}
    size={0.4}
    onobjectChange={(evt) => {
        const object = evt.target.object;
        if (object) {
            object.position.x = THREE.MathUtils.clamp(object.position.x, -2, 2);
            object.position.y = THREE.MathUtils.clamp(object.position.y, -1, 1);
            object.position.z = THREE.MathUtils.clamp(object.position.z, -2, 2);
        }
    }}
    mode="translate"
>
    {#await gltf}
        <T.Mesh>
            <T.BoxGeometry args={[0.1, 0.1, 0.1]} />
            <T.MeshStandardMaterial
                transparent
                opacity={0.2}
                toneMapped={true}
                color="tomato"
            />
        </T.Mesh>
    {:then { a, b }}
        <T
            is={a}
            oncreate={(scene) => {
                const clock = new THREE.Clock();
                function animate() {
                    requestAnimationFrame(animate);

                    const elapsedTime = clock.getElapsedTime();

                    scene.traverse((node) => {
                        if (node.isMesh && node.userData.shader) {
                            node.userData.shader.uniforms.uTime.value =
                                elapsedTime;
                            node.userData.shader.uniforms.uMotor.value = motor;
                        }
                    });

                    vfmaterial.uniforms.uMotor = { value: motor };
                }
                animate();
            }}
        />
        <T is={b} />
    {/await}
</TransformControls>

{#each elements as { el, color, active }, eli}
    {#if cga.isSphere(el)}
        {@const sphCoords = cga.sphereParameters(el)}

        <TransformControls
            enabled={active}
            size={active ? 0.6 : 0}
            maxX={2}
            maxY={2}
            maxZ={2}
            minX={-2}
            minY={-2}
            minZ={-2}
            scale={Math.max(sphCoords.radius, 0.1)}
            position={[
                sphCoords.center[0],
                sphCoords.center[1],
                sphCoords.center[2],
            ]}
            onobjectChange={(evt) => {
                const object = evt.target.object;
                if (object) {
                    const activeAxis = evt.target.axis;

                    object.position.x = THREE.MathUtils.clamp(
                        object.position.x,
                        -2,
                        2,
                    );
                    object.position.y = THREE.MathUtils.clamp(
                        object.position.y,
                        -1,
                        1,
                    );
                    object.position.z = THREE.MathUtils.clamp(
                        object.position.z,
                        -2,
                        2,
                    );
                    elements[eli].el = cga.sphere(
                        1 * object.position.x,
                        1 * object.position.y,
                        1 * object.position.z,
                        1 * sphCoords.radius,
                    );
                }
            }}
            mode={"translate"}
        >
            <T.Mesh renderOrder={40000 + eli * 100}>
                <T.SphereGeometry args={[1, 32, 16]} />
                <T.MeshStandardMaterial
                    toneMapped={false}
                    side={THREE.DoubleSide}
                    opacity={active ? 0.6 : 0.1}
                    depthWrite={false}
                    transparent={true}
                    premultipliedAlpha={true}
                    clippingPlanes={planes}
                    color={active ? color : "gray"}
                />
            </T.Mesh>
        </TransformControls>
    {:else if cga.isPlane(el)}
        {@const plnParams = cga.planeParameters(el)}
        {@const rot = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(
                plnParams?.normal[0],
                plnParams?.normal[1],
                plnParams?.normal[2],
            ).normalize(),
        )}
        <T.Group quaternion={rot.toArray()}>
            <T.Group position={[0, 0, plnParams?.distance]}>
                <T.Mesh
                    position={[0, 0, 0.05 / 2]}
                    rotation={[Math.PI / 2, 0, 0]}
                    renderOrder={20000 + eli * 100}
                >
                    <T.ConeGeometry args={[0.02, 0.05, 32]} />
                    <T.MeshStandardMaterial
                        depthWrite={false}
                        transparent={true}
                        premultipliedAlpha={true}
                        color={active ? color : "gray"}
                        clippingPlanes={planes}
                    />
                </T.Mesh>
                {#each { length: 4 } as _, r}
                    {#each { length: 12 } as _, a}
                        <T.Mesh
                            renderOrder={20000 + eli * 100 + r * 12 + a}
                            position={[
                                (r / 2 + 0.5) *
                                    Math.sin(((Math.PI * 2) / 12) * a),
                                (r / 2 + 0.5) *
                                    Math.cos(((Math.PI * 2) / 12) * a),
                                0.05 / 2,
                            ]}
                            rotation={[Math.PI / 2, 0, 0]}
                        >
                            <T.ConeGeometry args={[0.02, 0.05, 32]} />
                            <T.MeshStandardMaterial
                                depthWrite={false}
                                transparent={true}
                                premultipliedAlpha={true}
                                color={active ? color : "gray"}
                                clippingPlanes={planes}
                            />
                        </T.Mesh>
                    {/each}
                {/each}
                <T.Mesh renderOrder={20000 + eli * 100 + 4 * 12 + 1}>
                    <T.PlaneGeometry args={[16, 16]} />
                    <T.MeshStandardMaterial
                        toneMapped={false}
                        side={THREE.DoubleSide}
                        opacity={active ? 0.6 : 0.1}
                        depthWrite={false}
                        transparent={true}
                        premultipliedAlpha={true}
                        clippingPlanes={planes}
                        color={active ? color : "gray"}
                    />
                </T.Mesh>
            </T.Group>
        </T.Group>
    {:else if cga.isEuclideanPoint(el)}
        {@const p = cga.pointParameters(el)}
        <TransformControls
            position={[p.x, p.y, p.z]}
            size={0.4}
            onobjectChange={(evt) => {
                const object = evt.target.object;
                if (object) {
                    object.position.x = THREE.MathUtils.clamp(
                        object.position.x,
                        -2,
                        2,
                    );
                    object.position.y = THREE.MathUtils.clamp(
                        object.position.y,
                        -1,
                        1,
                    );
                    object.position.z = THREE.MathUtils.clamp(
                        object.position.z,
                        -2,
                        2,
                    );
                    const np = cga.pointReflection(
                        object.position.x,
                        object.position.y,
                        object.position.z,
                    );
                    elements[eli].el = np;
                }
            }}
            mode="translate"
        >
            <T.Mesh
                renderOrder={20000 + eli * 100 + 4 * 12 + 1}
                rotation={[0, 0, 0]}
            >
                <T.SphereGeometry args={[0.08, 32, 16]} />
                <T.MeshBasicMaterial
                    toneMapped={false}
                    side={THREE.DoubleSide}
                    opacity={active ? 0.6 : 0.1}
                    transparent={true}
                    premultipliedAlpha={true}
                    clippingPlanes={planes}
                    color={active ? color : "gray"}
                />
            </T.Mesh>
        </TransformControls>
    {:else if cga.isCircle(el)}
        {@const cirParams = cga.circleParameters(el)}
        {@const rot = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(
                cirParams?.normal[0],
                cirParams?.normal[1],
                cirParams?.normal[2],
            ).normalize(),
        )}
        <T.Mesh position={cirParams?.center} quaternion={rot.toArray()}>
            <T.TorusGeometry args={[cirParams?.radius, 0.01, 32, 64]} />
            <T.MeshBasicMaterial
                toneMapped={false}
                side={THREE.DoubleSide}
                opacity={active ? 0.6 : 0.1}
                transparent={true}
                premultipliedAlpha={true}
                clippingPlanes={planes}
                color={active ? color : "gray"}
            />
        </T.Mesh>
    {:else if cga.isLine(el)}
        {@const lineParams = cga.lineParameters(el)}
        {@const rot = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(
                lineParams?.direction[0],
                lineParams?.direction[1],
                lineParams?.direction[2],
            ).normalize(),
        )}
        <T.Mesh position={lineParams?.point} quaternion={rot.toArray()}>
            <T.CylinderGeometry args={[0.015, 0.015, 4, 32]} />
            <T.MeshBasicMaterial
                toneMapped={false}
                side={THREE.DoubleSide}
                opacity={active ? 0.6 : 0.1}
                transparent={true}
                clippingPlanes={planes}
                premultipliedAlpha={true}
                color={active ? color : "gray"}
            />
        </T.Mesh>
    {:else if cga.isPointPair(el)}
        {@const [a, b] = cga.pointPairCoords(el)}
        <TransformControls
            position={[a.x, a.y, a.z]}
            size={0.4}
            onobjectChange={(evt) => {
                const object = evt.target.object;
                if (object) {
                    object.position.x = THREE.MathUtils.clamp(
                        object.position.x,
                        -2,
                        2,
                    );
                    object.position.y = THREE.MathUtils.clamp(
                        object.position.y,
                        -1,
                        1,
                    );
                    object.position.z = THREE.MathUtils.clamp(
                        object.position.z,
                        -2,
                        2,
                    );
                    const npp = cga.pointPair(
                        cga.zeroSphere(
                            object.position.x,
                            object.position.y,
                            object.position.z,
                        ),

                        cga.zeroSphere(b.x, b.y, b.z),
                    );
                    if (cga.isPointPair(npp)) elements[eli].el = npp;
                }
            }}
            mode="translate"
        >
            <T.Mesh
                renderOrder={20000 + eli * 100 + 4 * 12 + 1}
                rotation={[0, 0, 0]}
            >
                <T.SphereGeometry args={[0.08, 32, 16]} />
                <T.MeshBasicMaterial
                    toneMapped={false}
                    side={THREE.DoubleSide}
                    opacity={active ? 0.6 : 0.1}
                    transparent={true}
                    premultipliedAlpha={true}
                    clippingPlanes={planes}
                    color={active ? color : "gray"}
                />
            </T.Mesh>
        </TransformControls>
        <TransformControls
            position={[b.x, b.y, b.z]}
            size={0.4}
            onobjectChange={(evt) => {
                const object = evt.target.object;
                if (object) {
                    object.position.x = THREE.MathUtils.clamp(
                        object.position.x,
                        -2,
                        2,
                    );
                    object.position.y = THREE.MathUtils.clamp(
                        object.position.y,
                        -1,
                        1,
                    );
                    object.position.z = THREE.MathUtils.clamp(
                        object.position.z,
                        -2,
                        2,
                    );
                    const npp = cga.pointPair(
                        cga.zeroSphere(a.x, a.y, a.z),
                        cga.zeroSphere(
                            object.position.x,
                            object.position.y,
                            object.position.z,
                        ),
                    );
                    if (cga.isPointPair(npp)) elements[eli].el = npp;
                }
            }}
            mode="translate"
        >
            <T.Mesh
                rotation={[0, 0, 0]}
                renderOrder={20000 + eli * 100 + 4 * 12 + 1}
            >
                <T.SphereGeometry args={[0.08, 32, 16]} />
                <T.MeshBasicMaterial
                    toneMapped={false}
                    side={THREE.DoubleSide}
                    opacity={active ? 0.6 : 0.1}
                    transparent={true}
                    premultipliedAlpha={true}
                    clippingPlanes={planes}
                    color={active ? color : "gray"}
                />
            </T.Mesh>
        </TransformControls>
    {/if}
{/each}
