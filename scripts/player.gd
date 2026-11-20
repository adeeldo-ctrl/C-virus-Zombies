extends CharacterBody3D

@export var move_speed: float = 5.5
@export var acceleration: float = 16.0
@export var jump_velocity: float = 4.5
@export var mouse_sensitivity: float = 0.0025

var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
@onready var spring_arm: SpringArm3D = $SpringArm3D

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
        rotate_y(-event.relative.x * mouse_sensitivity)
        spring_arm.rotate_x(-event.relative.y * mouse_sensitivity)
        spring_arm.rotation.x = clamp(spring_arm.rotation.x, deg_to_rad(-55), deg_to_rad(35))

func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity.y -= gravity * delta

    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity

    var input_vector := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
    var direction := (transform.basis * Vector3(input_vector.x, 0, input_vector.y)).normalized()

    if direction.length() > 0.01:
        velocity.x = move_toward(velocity.x, direction.x * move_speed, acceleration * delta)
        velocity.z = move_toward(velocity.z, direction.z * move_speed, acceleration * delta)
    else:
        velocity.x = move_toward(velocity.x, 0.0, acceleration * delta)
        velocity.z = move_toward(velocity.z, 0.0, acceleration * delta)

    move_and_slide()
