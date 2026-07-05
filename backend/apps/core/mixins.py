class OwnedQuerySetMixin:
    """DRF viewset mixin that scopes the queryset to the requesting user.

    Assumes the model has a `user` FK (see UserOwnedModel).
    """

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)
