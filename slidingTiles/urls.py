"""
URL configuration for slidingTiles project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from . import views

# Add more urls here!
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.landing_view, name='landing'),
    path('game/', views.game_view, name='game'),
    path('start/', views.start_game, name='start_game'),
    path('shuffle/', views.shuffle, name='shuffle'),
    path('move/', views.make_move, name='make_move'),
    path('ida_solve/', views.ida_solve, name='ida_solve'),
    path('greedy_solve/', views.greedy_solve, name='greedy_solve'),
]

