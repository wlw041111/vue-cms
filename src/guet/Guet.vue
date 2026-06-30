<script setup lang="ts">

</script>

<template>
  <ul class="LOG-GUET">
    <ul class="LOG-GUET-First">
      <ul class="LOG-GUET-picture">
        <img src="@/assets/GUET-LOG.png">
        <ul class="FIND"></ul>
      </ul>
    </ul>

  </ul>
  <nav>
    <ul class="first">

      <!--    <li style="color:red; none">-->
      <li>
        <a href="">首页</a>
      </li>
      <li>
        <a href="">学院概况</a>
        <ul class="second">
          <li>
            <a href="">学院概况</a>
          </li>
          <li>
            <a href="">现任领导</a>
          </li>
          <li>
            <a href="">组织机构</a>

          </li>
          <li>
            <a href="">办事指南</a>
          </li>
        </ul>
      </li>
      <li>
        <a href="">师资队伍</a>
      </li>
      <li>
        <a href="">本科生教育</a>
      </li>
      <li>
        <a href="">研究生教育</a>
      </li>
      <li>
        <a href="">科学研究</a>
      </li>
      <li>
        <a href="">党建工作</a>
      </li>
      <li>
        <a href="">学生工作</a>
      </li>
      <li>
        <a href="">人才招聘</a>
      </li>
      <li>
        <a href="">理论学习</a>
      </li>
    </ul>
  </nav>

  <router-view> </router-view>

<ul class="END">
  <ul class="END-block"></ul>
<ul class="END-Frist">
  <ul class="END-Second">
    <li>Copyright© 2018 All Rights Reserved. 桂林电子科技大学数学与计算科学学院</li>
  </ul>
</ul>

</ul>
</template>

