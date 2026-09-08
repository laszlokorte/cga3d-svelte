<script>
    import * as THREE from "three";
    import { T, useThrelte, useTask } from "@threlte/core";
    import {
        CameraControls,
        Sky,
        TransformControls,
        Gizmo,
        Environment,
    } from "@threlte/extras";
    const { renderer, canvas } = useThrelte();

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
    <CameraControls draggingSmoothTime={0.01} maxDistance={16} minDistance={3}>
        <Gizmo placement="top-right" />
    </CameraControls>
    <T.Group bind:ref={group}>
        <T.Mesh renderOrder={-1} rotation={[Math.PI / 2, 0, 0]}>
            <T.TorusGeometry args={[1, 0.001, 32, 64]} />
            <T.MeshBasicMaterial
                toneMapped={false}
                depthTest={false}
                depthWrite={false}
                color="orange"
            />
        </T.Mesh>
        <T.Mesh renderOrder={-1} rotation={[0, Math.PI / 2, 0]}>
            <T.TorusGeometry args={[1, 0.001, 32, 64]} />
            <T.MeshBasicMaterial
                toneMapped={false}
                depthTest={false}
                depthWrite={false}
                color="red"
            />
        </T.Mesh>
        <T.Mesh renderOrder={-1} rotation={[0, 0, 0]}>
            <T.TorusGeometry args={[1, 0.001, 32, 64]} />
            <T.MeshBasicMaterial
                toneMapped={false}
                depthTest={false}
                depthWrite={false}
                color="green"
            />
        </T.Mesh>
        {#each [[0, -10, 0], [0, 10, 0], [10, 0, 0], [-10, 0, 0], [0, 0, 10], [0, 0, -10]] as [x, y, z]}
            <T.Mesh renderOrder={-1} rotation={[0, 0, 0]} position={[x, y, z]}>
                <T.SphereGeometry args={[0.08, 32, 16]} />
                <T.MeshBasicMaterial
                    toneMapped={false}
                    depthTest={false}
                    depthWrite={false}
                    color="magenta"
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
        color="#fff"
        side={THREE.BackSide}
    />
</T.Mesh>

<TransformControls
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
        <T.MeshStandardMaterial toneMapped={false} color="red" />
    </T.Mesh>
</TransformControls>
<T.DirectionalLight position={[3, 10, 5]} intensity={2} />

{#each plns as p}
    {@const rot = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(p.x, p.y, p.z).normalize(),
    )}
    <T.Group quaternion={rot.toArray()}>
        <T.Mesh position={[0, 0, p.d]}>
            <T.PlaneGeometry args={[16, 16]} />
            <T.MeshStandardMaterial
                opacity={0.7}
                transparent={true}
                clippingPlanes={planes}
                color={p.color}
                toneMapped={false}
                side={THREE.DoubleSide}
            />
        </T.Mesh>
    </T.Group>
{/each}
