<?php
header('Content-Type:application/json');

@$kw = $_REQUEST['kw'];
if(empty($kw))
{
  echo '[]';
  return;
}

require("init.php");

//从kf_dish表中去查询数据
$sql = "select img_sm,did,name,price,material from kf_dish where name like '%$kw%' or material like '%$kw%'";
$result = mysqli_query($conn,$sql);
$output = [];
while(true)
{
  //考虑到第版本的php 也可以fetch_all
  $row = mysqli_fetch_assoc($result);
  if(!$row)
  {
   break;
  }
  $output[] = $row;
}

echo json_encode($output);





?>