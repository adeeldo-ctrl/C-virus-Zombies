extends CharacterBody3D

@export var move_speed: float = 2.0
@export var notice_distance: float = 18.0
@export var stop_distance: float = 1.35

var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var target: Node3D

func _ready() -> void:
    target = get_tree().get_first_node_in_group("player")

func _physics_process(delta: float) -> void:
    if target == null or not is_instance_valid(target):
        target = get_tree().get_first_node_in_group("player")

    if not is_on_floor():
        velocity.y -= gravity * delta

    if target != null:
        var offset: Vector3 = target.global_position - global_position
        offset.y = 0.0
        var distance := offset.length()
        if distance <= notice_distance and distance > stop_distance:
            var direction := offset.normalized()
            velocity.x = direction.x * move_speed
            velocity.z = direction.z * move_speed
            look_at(global_position + direction, Vector3.UP)
        else:
            velocity.x = move_toward(velocity.x, 0.0, move_speed * delta * 2.0)
            velocity.z = move_toward(velocity.z, 0.0, move_speed * delta * 2.0)

    move_and_slide()
