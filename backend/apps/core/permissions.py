from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Object-level permission restricting access to UserOwnedModel rows the
    requesting user actually owns."""

    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.id
