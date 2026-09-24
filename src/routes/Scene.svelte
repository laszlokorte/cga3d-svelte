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
    import { CapsuleGeometry } from "./capsule";

    const { renderer, canvas } = useThrelte();

    const { a, b } = await useGltf(resolve("/nike.glb")).then((m) => {
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
                material.side = THREE.DoubleSide;
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
                const hsl = {};
                material.color.getHSL(hsl);
                material.side = THREE.DoubleSide;

                hsl.s *= 0.5; // 50% less saturation
                hsl.l *= 0.1; // 50% less saturation

                material.color.setHSL(hsl.h, hsl.s, hsl.l);
                material.transparent = true;
                material.opacity = 0.8;

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
                            /* glsl */ `
                            #include <begin_vertex>
                            // Modify transformed vertex position (e.g., wave effect)
                            transformed *= 1.015+sin(position.x*40.0 + uTime * 3.0) * 0.005 + cos(position.z*15.0 + uTime * 3.0) * 0.005;
                            `,
                        )
                        .replace(
                            "#include <project_vertex>",
                            /* glsl */ `
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
                            /* glsl */ `
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

    const {
        elements = $bindable(),
        showVectorField = false,
        motor = cga.scalar(0),
        wedged,
        wedgeColor = "gray",
        showMotor = false,
        motorColor = "rebeccapurple",
        showIntersections,
        showObject,
    } = $props();

    let objPos = $state([1, 0, 0]);
    renderer.localClippingEnabled = true;

    const cubeW = 2.05;
    const cubeD = 2.05;
    const cubeH = 1.05;
    const cubeW_ = 2.03;
    const cubeD_ = 2.03;
    const cubeH_ = 1.03;
    let group = $state();
    let camera = $state();
    const planes = [
        new THREE.Plane(
            new THREE.Vector3(1, 0, 0), // normal
            cubeW_, // distance
        ),
        new THREE.Plane(
            new THREE.Vector3(-1, 0, 0), // normal
            cubeW_, // distance
        ),
        new THREE.Plane(
            new THREE.Vector3(0, 1, 0), // normal
            cubeH_, // distance
        ),
        new THREE.Plane(
            new THREE.Vector3(0, -1, 0), // normal
            cubeH_, // distance
        ),
        new THREE.Plane(
            new THREE.Vector3(0, 0, 1), // normal
            cubeD_, // distance
        ),
        new THREE.Plane(
            new THREE.Vector3(0, 0, -1), // normal
            cubeD_, // distance
        ),
    ];
    const planesOuter = [
        new THREE.Plane(
            new THREE.Vector3(1, 0, 0), // normal
            1.5 * cubeW_, // distance
        ),
        new THREE.Plane(
            new THREE.Vector3(-1, 0, 0), // normal
            1.5 * cubeW_, // distance
        ),
        new THREE.Plane(
            new THREE.Vector3(0, 1, 0), // normal
            1.5 * cubeH_, // distance
        ),
        new THREE.Plane(
            new THREE.Vector3(0, -1, 0), // normal
            1.5 * cubeH_, // distance
        ),
        new THREE.Plane(
            new THREE.Vector3(0, 0, 1), // normal
            1.5 * cubeD_, // distance
        ),
        new THREE.Plane(
            new THREE.Vector3(0, 0, -1), // normal
            1.5 * cubeD_, // distance
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
            (rect.bottom - c.bottom) / 2,
            rect.width,
            rect.height,
        );

        camera.updateProjectionMatrix();
    }

    const points = [
        new THREE.Vector3(-cubeW, cubeH, -cubeD),
        new THREE.Vector3(cubeW, cubeH, -cubeD),
        new THREE.Vector3(cubeW, cubeH, -cubeD),
        new THREE.Vector3(cubeW, cubeH, cubeD),
        new THREE.Vector3(cubeW, cubeH, cubeD),
        new THREE.Vector3(-cubeW, cubeH, cubeD),
        new THREE.Vector3(-cubeW, cubeH, cubeD),
        new THREE.Vector3(-cubeW, cubeH, -cubeD),
        new THREE.Vector3(-cubeW, -cubeH, -cubeD),
        new THREE.Vector3(-cubeW, -cubeH, -cubeD),
        new THREE.Vector3(cubeW, -cubeH, -cubeD),
        new THREE.Vector3(cubeW, cubeH, -cubeD),
        new THREE.Vector3(cubeW, -cubeH, -cubeD),
        new THREE.Vector3(cubeW, -cubeH, -cubeD),
        new THREE.Vector3(cubeW, -cubeH, cubeD),
        new THREE.Vector3(cubeW, cubeH, cubeD),
        new THREE.Vector3(cubeW, -cubeH, cubeD),
        new THREE.Vector3(cubeW, -cubeH, cubeD),
        new THREE.Vector3(-cubeW, -cubeH, cubeD),
        new THREE.Vector3(-cubeW, -cubeH, cubeD),
        new THREE.Vector3(-cubeW, cubeH, cubeD),
        new THREE.Vector3(-cubeW, -cubeH, cubeD),
        new THREE.Vector3(-cubeW, -cubeH, -cubeD),
    ];

    const nx = 8;
    const nz = 8;

    const vfcount = nx * nz;

    const vfgeometry = CapsuleGeometry(0.01, 2, 8, 32);
    const vfgeometry2 = CapsuleGeometry(0.01, 8, 8, 4 * 32);
    const vfmaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uSpeed: { value: 0.3 },
            uMotor: { value: cga.scalar(0) },
            uOpacity: { value: 0.5 },
        },

        vertexShader: /* glsl */ `
            #include <clipping_planes_pars_vertex>

            attribute vec4 aPosition;

            uniform float uMotor[32];
            uniform float uTime;
            uniform float uSpeed;

            varying float skip;

            ${generateGP()}
            float outsideLength(vec3 v, vec3 bounds) {

                vec3 t = mix(
                    bounds / abs(v),
                    vec3(1e30),
                    lessThan(abs(v), vec3(1e-6))
                );

                float exitT = min(t.x, min(t.y, t.z));

                return max(0.0, 1.0 - exitT) * length(v);
            }

            void main() {
                MV motor;

                for (int i = 0; i < 32; i++)
                    motor.c[i] = uMotor[i];

                float interp =
                    (position.y + 1.0) +
                    mod(uTime * uSpeed + aPosition.w * 4.0, 4.0);

                MV partialMotor =
                    motorExp(scale(3.141 / 4.0 * interp, motor));

                // Center of this cylinder slice
                MV centerP = point(aPosition.xyz);
                vec3 center =
                    pointCoords(sandwich(centerP, partialMotor));

                // Two points defining the local X/Z axes of the disk.
                MV xP = point(aPosition.xyz + vec3(1.0, 0.0, 0.0));
                MV zP = point(aPosition.xyz + vec3(0.0, 0.0, 1.0));

                // Transform those axes and remove the translation.
                vec3 x =
                    pointCoords(sandwich(xP, partialMotor)) - center;

                vec3 z =
                    pointCoords(sandwich(zP, partialMotor)) - center;

                // Reconstruct the cylinder vertex in the transformed frame.
                vec3 coords =
                    center +
                    position.x * normalize(x) +
                    position.z * normalize(z);

                skip = 1.0;

                vec4 worldPos =
                    modelMatrix * vec4(coords, 1.0);

                vec4 mvPosition =
                    modelViewMatrix * worldPos;


                float outsideFade = 1.0 - smoothstep(0.0, 0.4, outsideLength(worldPos.xyz, vec3(2.0, 1.0, 2.0)));
                skip *= outsideFade ;

                #include <clipping_planes_vertex>

                gl_Position =
                    projectionMatrix * mvPosition;
            }
        `,

        fragmentShader: /* glsl */ `
               #include <clipping_planes_pars_fragment>
               uniform float uOpacity;
               varying float skip;

               void main() {
                   #include <clipping_planes_fragment>

                   gl_FragColor = vec4(1.0,0.8,0.1,1.0* uOpacity * skip) ;
               }
           `,
    });

    const vfmesh = new THREE.InstancedMesh(vfgeometry, vfmaterial, vfcount);
    const vfmesh2 = new THREE.InstancedMesh(vfgeometry2, vfmaterial, vfcount);

    const positions = new Float32Array(vfcount * 4);
    for (let i = 0; i < vfcount; i++) {
        const ix = i % nx;
        const iz = Math.floor(i / nx);

        const x =
            ((ix - (nx - 1) / 2 + THREE.MathUtils.randFloat(-0.4, 0.4)) * 4) /
            nx;
        const y = THREE.MathUtils.randFloat(-1, 1);
        const z =
            ((iz - (nz - 1) / 2 + THREE.MathUtils.randFloat(-0.4, 0.4)) * 4) /
            nz;
        positions[i * 4 + 0] = x;
        positions[i * 4 + 1] = y;
        positions[i * 4 + 2] = z;
        positions[i * 4 + 3] = ((i * (x + y + z)) % vfcount) / vfcount;
    }

    vfgeometry.setAttribute(
        "aPosition",
        new THREE.InstancedBufferAttribute(positions, 4),
    );
    vfgeometry2.setAttribute(
        "aPosition",
        new THREE.InstancedBufferAttribute(positions, 4),
    );

    vfmesh.renderOrder = 9999999;
    vfmesh2.renderOrder = 9999999;
    vfmesh.instanceMatrix.needsUpdate = true;
    vfmesh2.instanceMatrix.needsUpdate = true;

    vfmaterial.side = THREE.FrontSide;
    vfmaterial.clippingPlanes = planesOuter;
    vfmaterial.clipping = true;
    vfmaterial.depthTest = true;
    vfmaterial.depthWrite = false;
    vfmaterial.clipping = true;
    vfmaterial.transparent = true;
    vfmaterial.toneMapped = false;
    const checkerCanvas = document.createElement("canvas");
    checkerCanvas.width = checkerCanvas.height = 128;

    {
        const ctx = checkerCanvas.getContext("2d");
        ctx.fillStyle = "#eee";
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillRect(64, 64, 64, 64);
    }

    const textureChecker = new THREE.CanvasTexture(checkerCanvas);
    textureChecker.wrapS = THREE.RepeatWrapping;
    textureChecker.wrapT = THREE.RepeatWrapping;
    textureChecker.repeat.set(16, 8);
    textureChecker.colorSpace = THREE.SRGBColorSpace;
</script>

{#if showObject && a && b}
    <TransformControls
        visible={showObject}
        scale={5}
        position={objPos}
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
            }
            objPos = object.position.toArray();
        }}
        mode="translate"
    />
{/if}

<T
    scale={5}
    position={objPos}
    visible={showObject}
    is={a}
    oncreate={(scene) => {
        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();

            scene.traverse((node) => {
                if (node.isMesh && node.userData.shader) {
                    node.userData.shader.uniforms.uTime.value = elapsedTime;
                    node.userData.shader.uniforms.uMotor.value = motor;
                }
            });

            vfmaterial.uniforms.uMotor.value = motor;
            vfmaterial.uniforms.uTime.value = elapsedTime;
        }
        animate();
    }}
/>
<T scale={5} position={objPos} visible={showObject} is={b} />

{#if showVectorField}
    <T is={vfmesh} />
    {#if Math.abs(Math.sign(cga.spinorNorm(motor))) != 1}
        <T is={vfmesh2} />
    {/if}
{/if}

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
        {#each [...elements, ...(showMotor && motor ? [{ el: motor, color: motorColor, active: true, passive: true }] : [{ el: cga.scalar(1), color: motorColor, active: true, passive: true }]), ...(showIntersections && wedged ? [{ el: wedged, color: wedgeColor, active: true, passive: true }] : [{ el: cga.scalar(1), color: wedgeColor, active: true, passive: true }])] as { el, color, active, passive }, eli (eli)}
            {#if cga.isSphereAtInfinity(el)}
                <T.Mesh renderOrder={-5} scale={1}>
                    <T.SphereGeometry args={[1, 16, 8]} />
                    <T.MeshStandardMaterial
                        toneMapped={false}
                        depthTest={false}
                        depthWrite={false}
                        opacity={active ? 0.6 : 0.1}
                        color={active ? color : "gray"}
                        side={THREE.BackSide}
                        transparent={true}
                        premultipliedAlpha={true}
                        map={textureChecker}
                    />
                </T.Mesh>
            {:else if cga.isSphereAtInfinity(cga.dual(el))}
                <T.Mesh renderOrder={-5} scale={1}>
                    <T.SphereGeometry args={[1, 16, 8]} />
                    <T.MeshStandardMaterial
                        toneMapped={false}
                        depthTest={false}
                        depthWrite={false}
                        opacity={active ? 0.6 : 0.1}
                        color={active ? color : "gray"}
                        side={THREE.BackSide}
                        transparent={true}
                        premultipliedAlpha={true}
                        map={textureChecker}
                    />
                </T.Mesh>
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

                <T.Mesh renderOrder={-2} quaternion={rot.toArray()}>
                    <T.TorusGeometry args={[1, 0.001, 32, 64]} />
                    <T.MeshBasicMaterial
                        toneMapped={false}
                        depthTest={false}
                        depthWrite={false}
                        transparent={true}
                        opacity={active ? 0.6 : 0.1}
                        color={active ? color : "gray"}
                    />
                </T.Mesh>
            {:else if cga.isPlane(cga.dual(el))}
                {@const plnParams = cga.planeParameters(cga.dual(el))}
                {@const rot = new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 0, 1),
                    new THREE.Vector3(
                        plnParams?.normal[0],
                        plnParams?.normal[1],
                        plnParams?.normal[2],
                    ).normalize(),
                )}

                <T.Mesh renderOrder={-2} quaternion={rot.toArray()}>
                    <T.TorusGeometry args={[1, 0.001, 32, 64]} />
                    <T.MeshBasicMaterial
                        toneMapped={false}
                        depthTest={false}
                        depthWrite={false}
                        transparent={true}
                        opacity={active ? 0.6 : 0.1}
                        color={active ? color : "gray"}
                    />
                </T.Mesh>
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

                <T.Group quaternion={rot.toArray()}>
                    <T.Mesh renderOrder={-1} position={[0, 0, 1]}>
                        <T.SphereGeometry args={[0.01, 32, 16]} />
                        <T.MeshBasicMaterial
                            toneMapped={false}
                            depthTest={false}
                            depthWrite={false}
                            map={textureChecker}
                            transparent={true}
                            opacity={active ? 0.6 : 0.1}
                            color={active ? color : "gray"}
                        />
                    </T.Mesh>
                    <T.Mesh renderOrder={-1} position={[0, 0, -1]}>
                        <T.SphereGeometry args={[0.01, 32, 16]} />
                        <T.MeshBasicMaterial
                            map={textureChecker}
                            toneMapped={false}
                            depthTest={false}
                            depthWrite={false}
                            transparent={true}
                            opacity={active ? 0.6 : 0.1}
                            color={active ? color : "gray"}
                        />
                    </T.Mesh>
                </T.Group>
            {:else if cga.isCircle(cga.dual(el))}
                {@const cirParams = cga.circleParameters(cga.dual(el))}
                {@const rot = new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 0, 1),
                    new THREE.Vector3(
                        cirParams?.normal[0],
                        cirParams?.normal[1],
                        cirParams?.normal[2],
                    ).normalize(),
                )}

                <T.Group quaternion={rot.toArray()}>
                    <T.Mesh renderOrder={-1} position={[0, 0, 1]}>
                        <T.SphereGeometry args={[0.01, 32, 16]} />
                        <T.MeshBasicMaterial
                            toneMapped={false}
                            depthTest={false}
                            depthWrite={false}
                            map={textureChecker}
                            transparent={true}
                            opacity={active ? 0.6 : 0.1}
                            color={active ? color : "gray"}
                        />
                    </T.Mesh>
                    <T.Mesh renderOrder={-1} position={[0, 0, -1]}>
                        <T.SphereGeometry args={[0.01, 32, 16]} />
                        <T.MeshBasicMaterial
                            toneMapped={false}
                            depthTest={false}
                            depthWrite={false}
                            map={textureChecker}
                            {color}
                        />
                    </T.Mesh>
                </T.Group>
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
                <T.Group quaternion={rot.toArray()}>
                    <T.Mesh renderOrder={-1} position={[0, 1, 0]}>
                        <T.SphereGeometry args={[0.01, 32, 16]} />
                        <T.MeshBasicMaterial
                            toneMapped={false}
                            depthTest={false}
                            depthWrite={false}
                            transparent={true}
                            map={textureChecker}
                            opacity={active ? 0.6 : 0.1}
                            color={active ? color : "gray"}
                        />
                    </T.Mesh>
                    <T.Mesh renderOrder={-1} position={[0, -1, 0]}>
                        <T.SphereGeometry args={[0.01, 32, 16]} />
                        <T.MeshBasicMaterial
                            toneMapped={false}
                            depthTest={false}
                            depthWrite={false}
                            transparent={true}
                            map={textureChecker}
                            opacity={active ? 0.6 : 0.1}
                            color={active ? color : "gray"}
                        />
                    </T.Mesh>
                </T.Group>
            {:else if cga.isLine(cga.dual(el))}
                {@const lineParams = cga.lineParameters(cga.dual(el))}
                {@const rot = new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3(
                        lineParams?.direction[0],
                        lineParams?.direction[1],
                        lineParams?.direction[2],
                    ).normalize(),
                )}
                <T.Group quaternion={rot.toArray()}>
                    <T.Mesh renderOrder={-1} position={[0, 1, 0]}>
                        <T.SphereGeometry args={[0.01, 32, 16]} />
                        <T.MeshBasicMaterial
                            toneMapped={false}
                            depthTest={false}
                            depthWrite={false}
                            map={textureChecker}
                            transparent={true}
                            opacity={active ? 0.6 : 0.1}
                            color={active ? color : "gray"}
                        />
                    </T.Mesh>
                    <T.Mesh renderOrder={-1} position={[0, -1, 0]}>
                        <T.SphereGeometry args={[0.01, 32, 16]} />
                        <T.MeshBasicMaterial
                            toneMapped={false}
                            depthTest={false}
                            depthWrite={false}
                            transparent={true}
                            map={textureChecker}
                            opacity={active ? 0.6 : 0.1}
                            color={active ? color : "gray"}
                        />
                    </T.Mesh>
                </T.Group>
            {:else if cga.isPointPair(el)}

            {:else if cga.isPointPair(cga.dual(el))}

            {:else if cga.isEuclideanPoint(el)}

            {:else if cga.isEuclideanPoint(cga.dual(el))}

            {/if}
        {/each}
    </T.Group>
    <T.Group visible={false}>
        {#each [{ rot: [Math.PI / 2, 0, 0], color: "magenta" }, { rot: [0, Math.PI / 2, 0], color: "cyan" }, { rot: [0, 0, 0], color: "yellow" }] as t}
            <T.Mesh renderOrder={-2} rotation={t.rot}>
                <T.TorusGeometry args={[1, 0.001, 32, 64]} />
                <T.MeshBasicMaterial
                    toneMapped={false}
                    depthTest={false}
                    depthWrite={false}
                    color={t.color}
                />
            </T.Mesh>
        {/each}

        {#each [{ pos: [0, -10, 0], color: "green" }, { pos: [0, 10, 0], color: "green" }, { pos: [10, 0, 0], color: wedgeColor }, { pos: [-10, 0, 0], color: wedgeColor }, { pos: [0, 0, 10], color: "blue" }, { pos: [0, 0, -10], color: "blue" }] as { color, pos: [x, y, z] }}
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
<Sky renderOrder={-200} elevation={90} rayleigh={0.2} turbidity={2} />
<T.Mesh>
    <T.BoxGeometry args={[2 * cubeW, 2 * cubeH, 2 * cubeD]} />
    <T.MeshStandardMaterial
        toneMapped={true}
        transparent={true}
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

{#each [...elements, ...(showMotor && motor ? [{ el: motor, color: motorColor, active: true, passive: true }] : [{ el: cga.scalar(1), color: motorColor, active: true, passive: true }]), ...(showIntersections && wedged ? [{ el: wedged, color: wedgeColor, active: true, passive: true }] : [{ el: cga.scalar(1), color: wedgeColor, active: true, passive: true }])] as { el, color, active, passive }, eli (eli)}
    {#if cga.isSpherical(el)}
        {@const sphCoords = cga.sphereParameters(el)}

        {#if active && !passive}
            <TransformControls
                enabled={active}
                size={active ? 0.6 : 0}
                maxX={2}
                maxY={2}
                maxZ={2}
                minX={-2}
                minY={-2}
                minZ={-2}
                scale={Math.max(Math.abs(sphCoords.radius), 0.1)}
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
                            sphCoords.sign,
                        );
                    }
                }}
                mode={"translate"}
            />
        {/if}
        <T.Group
            position={[
                sphCoords.center[0],
                sphCoords.center[1],
                sphCoords.center[2],
            ]}
        >
            <T.Mesh
                scale={Math.max(Math.abs(sphCoords.radius), 0.1)}
                renderOrder={passive ? 999999 : 40000 + eli * 100}
            >
                <T.SphereGeometry args={[1, 32, 16]} />
                <T.MeshStandardMaterial
                    toneMapped={false}
                    map={textureChecker}
                    side={THREE.DoubleSide}
                    opacity={active ? 0.6 : 0.1}
                    depthWrite={false}
                    transparent={true}
                    premultipliedAlpha={true}
                    clippingPlanes={planes}
                    color={active ? color : "gray"}
                />
            </T.Mesh>
            {#each { length: 8 } as _, r}
                {#each { length: 8 } as _, a}
                    {@const phi = (Math.PI * (r + 1)) / 8}
                    {@const theta = ((Math.PI * 2) / 8) * a}
                    {@const radius =
                        1 * Math.max(Math.abs(sphCoords.radius), 0.1) +
                        0.025 * Math.sign(sphCoords.radius)}
                    {@const normal = new THREE.Vector3(
                        Math.sin(phi) * Math.cos(theta),
                        Math.cos(phi),
                        Math.sin(phi) * Math.sin(theta),
                    )}

                    {@const quaternion =
                        new THREE.Quaternion().setFromUnitVectors(
                            new THREE.Vector3(
                                0,
                                Math.sign(sphCoords.radius),
                                0,
                            ),
                            normal,
                        )}

                    <T.Mesh
                        scale={Math.abs(Math.sign(sphCoords.radius))}
                        renderOrder={passive
                            ? 999999
                            : 20000 + eli * 100 + r * 16 + a}
                        position={[
                            radius * Math.sin(phi) * Math.cos(theta),
                            radius * Math.cos(phi),
                            radius * Math.sin(phi) * Math.sin(theta),
                        ]}
                        quaternion={quaternion.toArray()}
                    >
                        <T.ConeGeometry args={[0.02, 0.05, 32]} />
                        <T.MeshStandardMaterial
                            depthWrite={false}
                            transparent={true}
                            premultipliedAlpha={true}
                            {color}
                            opacity={active ? 0.6 : 0.1}
                            clippingPlanes={planes}
                        />
                    </T.Mesh>
                {/each}
            {/each}
        </T.Group>
    {:else if cga.isSpherical(cga.dual(el))}
        {@const sphCoords = cga.sphereParameters(cga.dual(el))}

        {#if active && !passive}
            <TransformControls
                enabled={active}
                size={active ? 0.6 : 0}
                maxX={2}
                maxY={2}
                maxZ={2}
                minX={-2}
                minY={-2}
                minZ={-2}
                scale={Math.max(Math.abs(sphCoords.radius), 0.1)}
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
                        elements[eli].el = cga.undual(
                            cga.sphere(
                                1 * object.position.x,
                                1 * object.position.y,
                                1 * object.position.z,
                                1 * sphCoords.radius,
                                sphCoords.sign,
                            ),
                        );
                    }
                }}
                mode={"translate"}
            />
        {/if}
        <T.Group
            position={[
                sphCoords.center[0],
                sphCoords.center[1],
                sphCoords.center[2],
            ]}
        >
            <T.Mesh
                scale={Math.max(Math.abs(sphCoords.radius), 0.1)}
                renderOrder={passive ? 999999 : 40000 + eli * 100}
            >
                <T.SphereGeometry args={[1, 32, 16]} />
                <T.MeshStandardMaterial
                    toneMapped={false}
                    map={textureChecker}
                    side={THREE.DoubleSide}
                    opacity={active ? 0.6 : 0.1}
                    depthWrite={false}
                    transparent={true}
                    premultipliedAlpha={true}
                    clippingPlanes={planes}
                    color={active ? color : "gray"}
                />
            </T.Mesh>
            {#each { length: 8 } as _, r}
                {#each { length: 8 } as _, a}
                    {@const phi = (Math.PI * (r + 1)) / 8}
                    {@const theta = ((Math.PI * 2) / 8) * a}
                    {@const radius =
                        1 * Math.max(Math.abs(sphCoords.radius), 0.1) +
                        0.025 * Math.sign(sphCoords.radius)}
                    {@const normal = new THREE.Vector3(
                        Math.sin(phi) * Math.cos(theta),
                        Math.cos(phi),
                        Math.sin(phi) * Math.sin(theta),
                    )}

                    {@const quaternion =
                        new THREE.Quaternion().setFromUnitVectors(
                            new THREE.Vector3(
                                0,
                                Math.sign(sphCoords.radius),
                                0,
                            ),
                            normal,
                        )}

                    <T.Mesh
                        scale={Math.abs(Math.sign(sphCoords.radius))}
                        renderOrder={passive
                            ? 999999
                            : 20000 + eli * 100 + r * 16 + a}
                        position={[
                            radius * Math.sin(phi) * Math.cos(theta),
                            radius * Math.cos(phi),
                            radius * Math.sin(phi) * Math.sin(theta),
                        ]}
                        quaternion={quaternion.toArray()}
                    >
                        <T.ConeGeometry args={[0.02, 0.05, 32]} />
                        <T.MeshStandardMaterial
                            depthWrite={false}
                            transparent={true}
                            premultipliedAlpha={true}
                            {color}
                            opacity={active ? 0.6 : 0.1}
                            clippingPlanes={planes}
                        />
                    </T.Mesh>
                {/each}
            {/each}
        </T.Group>
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

        {#if active && !passive}
            <TransformControls
                quaternion={rot.toArray()}
                position={new THREE.Vector3(0, 0, plnParams?.distance)
                    .applyQuaternion(rot)
                    .toArray()}
                size={active ? 0.8 : 0}
                clippingPlanes={planes}
                space="local"
                showX={false}
                showY={false}
                onobjectChange={(evt) => {
                    const object = evt.target.object;

                    const normal = new THREE.Vector3(
                        object.position.x,
                        object.position.y,
                        object.position.z,
                    ).normalize();

                    const pivot = object.position.clone();

                    let distance = Math.max(0, Math.min(2, normal.dot(pivot)));

                    const rev = normal.dot(
                        new THREE.Vector3(
                            plnParams?.normal[0],
                            plnParams?.normal[1],
                            plnParams?.normal[2],
                        ),
                    );
                    if (rev < 0) {
                        distance *= -1;
                        normal.negate();
                    }
                    if (distance == 0) {
                        return;
                    }

                    elements[eli].el = cga.plane(normal, distance);
                }}
                mode={"translate"}
            />
        {/if}

        <T.Group quaternion={rot.toArray()}>
            <T.Group position={[0, 0, plnParams?.distance]}>
                <T.Mesh
                    position={[0, 0, 0.05 / 2]}
                    rotation={[Math.PI / 2, 0, 0]}
                    renderOrder={passive ? 999999 : 20000 + eli * 100}
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
                            renderOrder={passive
                                ? 999999
                                : 20000 + eli * 100 + r * 12 + a}
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
                                {color}
                                opacity={active ? 0.6 : 0.1}
                                clippingPlanes={planes}
                            />
                        </T.Mesh>
                    {/each}
                {/each}
                <T.Mesh
                    renderOrder={passive
                        ? 999999
                        : 20000 + eli * 100 + 4 * 12 + 1}
                >
                    <T.PlaneGeometry args={[16, 8]} />
                    <T.MeshStandardMaterial
                        toneMapped={false}
                        side={THREE.DoubleSide}
                        opacity={active ? 0.6 : 0.1}
                        depthWrite={false}
                        transparent={true}
                        premultipliedAlpha={true}
                        clippingPlanes={planes}
                        {color}
                        map={textureChecker}
                    />
                </T.Mesh>
            </T.Group>
        </T.Group>
    {:else if cga.isPlane(cga.dual(el))}
        {@const plnParams = cga.planeParameters(cga.dual(el))}
        {@const rot = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(
                plnParams?.normal[0],
                plnParams?.normal[1],
                plnParams?.normal[2],
            ).normalize(),
        )}

        {#if active && !passive}
            <TransformControls
                quaternion={rot.toArray()}
                position={new THREE.Vector3(0, 0, plnParams?.distance)
                    .applyQuaternion(rot)
                    .toArray()}
                size={active ? 0.8 : 0}
                clippingPlanes={planes}
                space="local"
                showX={false}
                showY={false}
                onobjectChange={(evt) => {
                    const object = evt.target.object;

                    const normal = new THREE.Vector3(
                        object.position.x,
                        object.position.y,
                        object.position.z,
                    ).normalize();

                    const pivot = object.position.clone();

                    let distance = Math.max(0, Math.min(2, normal.dot(pivot)));

                    const rev = normal.dot(
                        new THREE.Vector3(
                            plnParams?.normal[0],
                            plnParams?.normal[1],
                            plnParams?.normal[2],
                        ),
                    );
                    if (rev < 0) {
                        distance *= -1;
                        normal.negate();
                    }
                    if (distance == 0) {
                        return;
                    }

                    elements[eli].el = cga.undual(cga.plane(normal, distance));
                }}
                mode={"translate"}
            />
        {/if}
        <T.Group quaternion={rot.toArray()}>
            <T.Group position={[0, 0, plnParams?.distance]}>
                <T.Mesh
                    position={[0, 0, 0.05 / 2]}
                    rotation={[Math.PI / 2, 0, 0]}
                    renderOrder={passive ? 999999 : 20000 + eli * 100}
                >
                    <T.ConeGeometry args={[0.02, 0.05, 32]} />
                    <T.MeshStandardMaterial
                        depthWrite={false}
                        transparent={true}
                        premultipliedAlpha={true}
                        {color}
                        opacity={active ? 0.6 : 0.1}
                        clippingPlanes={planes}
                    />
                </T.Mesh>
                {#each { length: 4 } as _, r}
                    {#each { length: 12 } as _, a}
                        <T.Mesh
                            renderOrder={passive
                                ? 999999
                                : 20000 + eli * 100 + r * 12 + a}
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
                                {color}
                                opacity={active ? 0.6 : 0.1}
                                clippingPlanes={planes}
                            />
                        </T.Mesh>
                    {/each}
                {/each}
                <T.Mesh
                    renderOrder={passive
                        ? 999999
                        : 20000 + eli * 100 + 4 * 12 + 1}
                >
                    <T.PlaneGeometry args={[16, 8]} />
                    <T.MeshStandardMaterial
                        toneMapped={false}
                        side={THREE.DoubleSide}
                        opacity={active ? 0.6 : 0.1}
                        depthWrite={false}
                        transparent={true}
                        premultipliedAlpha={true}
                        clippingPlanes={planes}
                        color={active ? color : "gray"}
                        map={textureChecker}
                    />
                </T.Mesh>
            </T.Group>
        </T.Group>
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
        {#if active && !passive}
            <TransformControls
                enabled={active}
                position={cirParams?.center}
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
                        const np = cga.circle(
                            [
                                object.position.x,
                                object.position.y,
                                object.position.z,
                            ],
                            cirParams?.radius,
                            cirParams?.normal,
                        );
                        elements[eli].el = np;
                    }
                }}
                mode="translate"
            />
        {/if}
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
    {:else if cga.isCircle(cga.dual(el))}
        {@const cirParams = cga.circleParameters(cga.dual(el))}
        {@const rot = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(
                cirParams?.normal[0],
                cirParams?.normal[1],
                cirParams?.normal[2],
            ).normalize(),
        )}
        {#if active && !passive}
            <TransformControls
                enabled={active}
                position={cirParams?.center}
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
                        const np = cga.undual(
                            cga.circle(
                                [
                                    object.position.x,
                                    object.position.y,
                                    object.position.z,
                                ],
                                cirParams?.radius,
                                cirParams?.normal,
                            ),
                        );
                        elements[eli].el = np;
                    }
                }}
                mode="translate"
            />
        {/if}
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

        <TransformControls
            quaternion={rot.toArray()}
            enabled={active && !passive}
            size={active && !passive ? 0.4 : 0}
            space="local"
            showY={false}
            position={lineParams?.point.map(
                (c, i) => c + lineParams.direction[i] * 0.5,
            )}
            onobjectChange={(evt) => {
                const object = evt.target.object;
                const p = object.position
                    .clone()
                    .sub(new THREE.Vector3(...lineParams.direction));
                const npp = cga.line(p.toArray(), lineParams?.direction);

                if (cga.isLine(npp)) elements[eli].el = npp;
            }}
            mode="translate"
        />
        <TransformControls
            quaternion={rot.toArray()}
            enabled={active && !passive}
            size={active && !passive ? 0.4 : 0}
            space="local"
            position={lineParams?.point}
            onmouseUp={(evt) => {
                const object = evt.target.object;
                const direction = new THREE.Vector3(0, 1, 0)
                    .applyQuaternion(object.quaternion)
                    .normalize();

                const p = new THREE.Vector3(...lineParams.point);

                // Keep p as the fixed rotation pivot during the drag.
                const npp = cga.line(p.toArray(), direction.toArray());
                const d1 = cga.sub(npp, elements[eli].el);
                const d2 = cga.add(npp, elements[eli].el);

                const isSame = Math.min(cga.norm2(d1), cga.norm2(d2)) < 1e-5;

                if (cga.isLine(npp) && !isSame) {
                    elements[eli].el = npp;
                }
            }}
            mode="rotate"
        >
            <T.Mesh>
                <T.CylinderGeometry args={[0.015, 0.015, 8, 32]} />
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
        </TransformControls>
    {:else if cga.isLine(cga.dual(el))}
        {@const lineParams = cga.lineParameters(cga.dual(el))}
        {@const rot = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(
                lineParams?.direction[0],
                lineParams?.direction[1],
                lineParams?.direction[2],
            ).normalize(),
        )}
        <TransformControls
            quaternion={rot.toArray()}
            enabled={active && !passive}
            size={active && !passive ? 0.4 : 0}
            space="local"
            showY={false}
            position={lineParams?.point.map(
                (c, i) => c + lineParams.direction[i] * 0.5,
            )}
            onobjectChange={(evt) => {
                const object = evt.target.object;
                const p = object.position
                    .clone()
                    .sub(new THREE.Vector3(...lineParams.direction));
                const npp = cga.line(p.toArray(), lineParams?.direction);

                if (cga.isLine(npp)) elements[eli].el = cga.undual(npp);
            }}
            mode="translate"
        />
        <TransformControls
            quaternion={rot.toArray()}
            enabled={active && !passive}
            size={active && !passive ? 0.4 : 0}
            space="local"
            position={lineParams?.point}
            onmouseUp={(evt) => {
                const object = evt.target.object;
                const direction = new THREE.Vector3(0, 1, 0)
                    .applyQuaternion(object.quaternion)
                    .normalize();

                const p = new THREE.Vector3(...lineParams.point);

                // Keep p as the fixed rotation pivot during the drag.
                const npp = cga.line(p.toArray(), direction.toArray());
                const d1 = cga.sub(npp, cga.dual(elements[eli].el));
                const d2 = cga.add(npp, cga.dual(elements[eli].el));

                const isSame = Math.min(cga.norm2(d1), cga.norm2(d2)) < 1e-5;

                if (cga.isLine(npp) && !isSame) {
                    elements[eli].el = cga.undual(npp);
                }
            }}
            mode="rotate"
        >
            <T.Mesh>
                <T.CylinderGeometry args={[0.015, 0.015, 8, 32]} />
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
        </TransformControls>
    {:else if cga.isPointPair(el)}
        {@const [a, b] = cga.pointPairCoords(el)}

        {#if active && !passive}
            <TransformControls
                enabled={active}
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
                                1 * object.position.x,
                                1 * object.position.y,
                                1 * object.position.z,
                            ),
                            cga.zeroSphere(1 * b.x, 1 * b.y, 1 * b.z),
                        );

                        if (cga.isPointPair(npp)) elements[eli].el = npp;
                    }
                }}
                mode="translate"
            />
        {/if}
        <T.Mesh
            position={[a.x, a.y, a.z]}
            renderOrder={passive ? 999999 : 20000 + eli * 100 + 4 * 12 + 1}
            rotation={[0, 0, 0]}
        >
            <T.SphereGeometry args={[0.08, 32, 16]} />
            <T.MeshBasicMaterial
                toneMapped={false}
                map={textureChecker}
                side={THREE.DoubleSide}
                opacity={active ? 0.6 : 0.1}
                transparent={true}
                premultipliedAlpha={true}
                clippingPlanes={planes}
                color={active ? color : "gray"}
            />
        </T.Mesh>
        {#if active && !passive}
            <TransformControls
                visible={active}
                enabled={active}
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
                            cga.zeroSphere(1 * a.x, 1 * a.y, 1 * a.z),
                            cga.zeroSphere(
                                1 * object.position.x,
                                1 * object.position.y,
                                1 * object.position.z,
                            ),
                        );

                        if (cga.isPointPair(npp)) elements[eli].el = npp;
                    }
                }}
                mode="translate"
            />
        {/if}
        <T.Mesh
            position={[b.x, b.y, b.z]}
            rotation={[0, 0, 0]}
            renderOrder={passive ? 999999 : 20000 + eli * 100 + 4 * 12 + 1}
        >
            <T.SphereGeometry args={[0.08, 32, 16]} />
            <T.MeshBasicMaterial
                map={textureChecker}
                toneMapped={false}
                side={THREE.DoubleSide}
                opacity={active ? 0.6 : 0.1}
                transparent={true}
                premultipliedAlpha={true}
                clippingPlanes={planes}
                color={active ? color : "gray"}
            />
        </T.Mesh>
    {:else if cga.isPointPair(cga.dual(el))}
        {@const [a, b] = cga.pointPairCoords(cga.dual(el))}
        {#if active && !passive}
            <TransformControls
                enabled={active}
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
                                1 * object.position.x,
                                1 * object.position.y,
                                1 * object.position.z,
                            ),
                            cga.zeroSphere(1 * b.x, 1 * b.y, 1 * b.z),
                        );

                        if (cga.isPointPair(npp))
                            elements[eli].el = cga.undual(npp);
                    }
                }}
                mode="translate"
            />
        {/if}
        <T.Mesh
            position={[a.x, a.y, a.z]}
            renderOrder={passive ? 999999 : 20000 + eli * 100 + 4 * 12 + 1}
            rotation={[0, 0, 0]}
        >
            <T.SphereGeometry args={[0.08, 32, 16]} />
            <T.MeshBasicMaterial
                map={textureChecker}
                toneMapped={false}
                side={THREE.DoubleSide}
                opacity={active ? 0.6 : 0.1}
                transparent={true}
                premultipliedAlpha={true}
                clippingPlanes={planes}
                color={active ? color : "gray"}
            />
        </T.Mesh>
        {#if active && !passive}
            <TransformControls
                visible={active}
                enabled={active}
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
                            cga.zeroSphere(1 * a.x, 1 * a.y, 1 * a.z),
                            cga.zeroSphere(
                                1 * object.position.x,
                                1 * object.position.y,
                                1 * object.position.z,
                            ),
                        );

                        if (cga.isPointPair(npp))
                            elements[eli].el = cga.undual(npp);
                    }
                }}
                mode="translate"
            />
        {/if}
        <T.Mesh
            position={[b.x, b.y, b.z]}
            rotation={[0, 0, 0]}
            renderOrder={passive ? 999999 : 20000 + eli * 100 + 4 * 12 + 1}
        >
            <T.SphereGeometry args={[0.08, 32, 16]} />
            <T.MeshBasicMaterial
                map={textureChecker}
                toneMapped={false}
                side={THREE.DoubleSide}
                opacity={active ? 0.6 : 0.1}
                transparent={true}
                premultipliedAlpha={true}
                clippingPlanes={planes}
                color={active ? color : "gray"}
            />
        </T.Mesh>
    {:else if cga.isEuclideanPoint(el)}
        {@const p = cga.pointParameters(el)}
        {#if active && !passive}
            <TransformControls
                enabled={active}
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
                            p.sign,
                        );
                        if (cga.isEuclideanPoint(np)) elements[eli].el = np;
                    }
                }}
                mode="translate"
            />
        {/if}
        <T.Mesh
            position={[p.x, p.y, p.z]}
            renderOrder={passive ? 999999 : 20000 + eli * 100 + 4 * 12 + 1}
            rotation={[0, 0, 0]}
        >
            <T.SphereGeometry args={[0.08, 32, 16]} />
            <T.MeshBasicMaterial
                map={textureChecker}
                toneMapped={false}
                side={THREE.DoubleSide}
                opacity={active ? 0.6 : 0.1}
                transparent={true}
                premultipliedAlpha={true}
                clippingPlanes={planes}
                color={active ? color : "gray"}
            />
        </T.Mesh>
    {:else if cga.isEuclideanPoint(cga.dual(el))}
        {@const p = cga.pointParameters(cga.dual(el))}
        {#if active && !passive}
            <TransformControls
                enabled={active}
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
                            p.sign,
                        );
                        if (cga.isEuclideanPoint(np))
                            elements[eli].el = cga.undual(np);
                    }
                }}
                mode="translate"
            />
        {/if}
        <T.Mesh
            position={[p.x, p.y, p.z]}
            renderOrder={passive ? 999999 : 20000 + eli * 100 + 4 * 12 + 1}
            rotation={[0, 0, 0]}
        >
            <T.SphereGeometry args={[0.08, 32, 16]} />
            <T.MeshBasicMaterial
                map={textureChecker}
                toneMapped={false}
                side={THREE.DoubleSide}
                opacity={active ? 0.6 : 0.1}
                transparent={true}
                premultipliedAlpha={true}
                clippingPlanes={planes}
                color={active ? color : "gray"}
            />
        </T.Mesh>
    {/if}
{/each}
