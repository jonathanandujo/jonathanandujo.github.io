---
title: Blog
permalink: /blog/
layout: blog
---

# Blog

{% assign blog_posts = site.posts | where_exp: "post", "post.categories contains 'blog'" %}
{% assign blog_posts = blog_posts | where_exp: "post", "post.hidden != true" %}
{% if blog_posts.size > 0 %}
{% for post in blog_posts %}
- [{{ post.title }}]({{ post.url }}) - {{ post.date | date: "%Y-%m-%d" }}
{% endfor %}
{% else %}
No posts found yet.
{% endif %}

