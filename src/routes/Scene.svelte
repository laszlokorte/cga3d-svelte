<script>
    import * as THREE from "three";
    import { T, useThrelte, useTask } from "@threlte/core";
    import { CameraControls, Sky, TransformControls } from "@threlte/extras";
    const { renderer } = useThrelte();

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
</script>

<T.PerspectiveCamera
    bind:ref={camera}
    makeDefault
    position={[10, 10, 10]}
    oncreate={(ref) => {
        ref.lookAt(0, 0, 0);
    }}
>
    <CameraControls
        draggingSmoothTime={0.01}
        maxDistance={16}
        minDistance={6}
    />
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
<T.DirectionalLight position={[2, 1, 3]} />
<Sky renderOrder={-2} elevation={90} rayleigh={0.1} turbidity={2} />
<T.Mesh>
    <T.BoxGeometry args={[4, 2, 4]} />
    <T.MeshStandardMaterial
        toneMapped={true}
        color="#fff"
        side={THREE.BackSide}
    />
</T.Mesh>

<TransformControls mode="translate">
    <T.Mesh>
        <T.BoxGeometry args={[1, 1, 1]} />
        <T.MeshStandardMaterial
            clippingPlanes={planes}
            toneMapped={false}
            color="red"
        />
    </T.Mesh>
</TransformControls>

<T.Mesh>
    <T.PlaneGeometry args={[4, 2, 1]} />
    <T.MeshStandardMaterial
        clippingPlanes={planes}
        toneMapped={false}
        color="teal"
        side={THREE.DoubleSide}
    />
</T.Mesh>
<T.Mesh rotation={[0, Math.PI / 2, 0]}>
    <T.PlaneGeometry args={[4, 2, 1]} />
    <T.MeshStandardMaterial
        clippingPlanes={planes}
        toneMapped={false}
        color="tomato"
        side={THREE.DoubleSide}
    />
</T.Mesh>

<T.Mesh rotation={[Math.PI / 2, 0, 0]}>
    <T.PlaneGeometry args={[4, 4, 1]} />
    <T.MeshStandardMaterial
        clippingPlanes={planes}
        toneMapped={false}
        color="orange"
        side={THREE.DoubleSide}
    />
</T.Mesh>
