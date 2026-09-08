<script>
    import * as THREE from "three";
    import { T, useThrelte, useTask } from "@threlte/core";
    import {
        CameraControls,
        Sky,
        TransformControls,
        Gizmo,
        useGltf,
    } from "@threlte/extras";
    const { renderer, canvas } = useThrelte();

    const gltf = useGltf("/nike.glb");
    const { planes: plns } = $props();

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
</script>

<T.PerspectiveCamera
    bind:ref={camera}
    makeDefault
    position={[5, 5, 5]}
    oncreate={(ref) => {
        ref.lookAt(0, 0, 0);
    }}
>
    <CameraControls draggingSmoothTime={0.01} maxDistance={16} minDistance={2}>
        <Gizmo placement="top-right" />
    </CameraControls>
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

<TransformControls
    size={0.4}
    onchange={(evt) => {
        const object = evt.target.object;
        if (object) {
            object.position.x = THREE.MathUtils.clamp(object.position.x, -2, 2);
            object.position.y = THREE.MathUtils.clamp(object.position.y, -1, 1);
            object.position.z = THREE.MathUtils.clamp(object.position.z, -2, 2);
        }
    }}
    mode="translate"
>
    <T.Mesh>
        <T.BoxGeometry args={[1, 1, 1]} />
        <T.MeshStandardMaterial toneMapped={false} color="gold" />
    </T.Mesh>
</TransformControls>

<T.DirectionalLight position={[3, 10, 5]} intensity={2} />

{#each plns as p, pi}
    {@const rot = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(p.x, p.y, p.z).normalize(),
    )}
    <T.Group quaternion={rot.toArray()}>
        <T.Group position={[0, 0, p.d]}>
            {#each { length: 4 } as _, r}
                {#each { length: 12 } as _, a}
                    <T.Mesh
                        position={[
                            (r / 2 + 0.5) * Math.sin(((Math.PI * 2) / 12) * a),
                            (r / 2 + 0.5) * Math.cos(((Math.PI * 2) / 12) * a),
                            0.05 / 2,
                        ]}
                        rotation={[Math.PI / 2, 0, 0]}
                    >
                        <T.ConeGeometry args={[0.02, 0.05, 32]} />
                        <T.MeshStandardMaterial
                            depthWrite={false}
                            transparent={true}
                            premultipliedAlpha={true}
                            color={p.color}
                            clippingPlanes={planes}
                        />
                    </T.Mesh>
                {/each}
            {/each}
            <T.Mesh renderOrder={100 + pi}>
                <T.PlaneGeometry args={[16, 16]} />
                <T.MeshStandardMaterial
                    opacity={0.6}
                    depthWrite={false}
                    transparent={true}
                    premultipliedAlpha={true}
                    clippingPlanes={planes}
                    color={p.color}
                    toneMapped={false}
                    side={THREE.DoubleSide}
                />
            </T.Mesh>
        </T.Group>
    </T.Group>
{/each}

{#await gltf then model}
    <TransformControls
        scale={5}
        position={[1, 0, 0]}
        size={0.4}
        onchange={(evt) => {
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
        }}
        mode="translate"
    >
        <T is={model.nodes["root"]} />
    </TransformControls>
    <TransformControls
        size={0.4}
        axis={"X"}
        maxX={2}
        maxY={2}
        maxZ={2}
        minX={-2}
        minY={-2}
        minZ={-2}
        position={[2, 0, 0]}
        onchange={(evt) => {
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
        }}
        mode="translate"
    >
        <T.Mesh>
            <T.SphereGeometry args={[0.5, 32, 16]} />
            <T.MeshStandardMaterial toneMapped={false} color="rebeccapurple" />
        </T.Mesh>
    </TransformControls>
{/await}
