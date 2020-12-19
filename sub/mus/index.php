<?php

require_once __DIR__ . '/vendor/autoload.php';

use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\UploadedFile;

$app = new \Slim\App();

class api
{
    private function conn()
    {
        //    $conn = new mysqli('b-x90akuqk2xpfn7.bch.rds.hkg.baidubce.com', 'b_x90akuqk2xpfn7', 'handaye123', 'b_x90akuqk2xpfn7');
        $conn = new mysqli('localhost', 'nashanxy_georoot', 'handaye123`', 'nashanxy_geodb');
        $conn->set_charset("utf8");
        return $conn;
    }

    private function getSQL($type, $param)
    {
        switch ($type) {
            case 'createJSON':
                return "create table json( Id int  primary key auto_increment,  Name varchar(255), Description varchar(255),Lat decimal(9, 7),Lng decimal(10, 7))";
            case 'insert':
                $Name = $param->Name;
                $Description = $param->Description;
                $Lat = $param->Lat;
                $Lng = $param->Lng;
                return "insert into json values (0,'$Name','$Description','$Lat','$Lng')";
            case 'get':
                return "select * from json where id = $param";
            case 'checkExist':
                return "select TABLE_NAME  from information_schema.TABLES where TABLE_SCHEMA ='geodb' and TABLE_NAME = '$param'";
            case'getAll':
                return "select * from json";
            default:
                return "";
        }

    }

    public function test($param)
    {
        return $param->Lat;
    }

    public function insert($param)
    {

        return $this->conn()->query($this->getSQL('insert', $param));
    }

    public function createJSON()
    {
        return $this->conn()->query($this->getSQL('createJSON', null));
    }

    public function get($id)
    {
        return $this->conn()->query($this->getSQL('get', $id));
    }

    public function getAll()
    {
        return $this->conn()->query($this->getSQL('getAll', null));
    }

    public function checkExist($tableName)
    {
        $this->conn()->query($this->getSQL('checkExist', $tableName));
    }

    public function success($result)
    {
        $arr = [];
        while ($row = mysqli_fetch_array($result, MYSQLI_ASSOC)) {
            $arr[] = $row;
        }
        return json_encode(array('code' => 200, 'data' => $arr));
    }

    public function error()
    {
        return json_encode(array('code' => 444, 'msg' => 'error'));
    }
}

/**
 * 插入经纬度信息
 */
$app->get('/insert/{Name}/{lat}/{lng}/{Description}', function ($request, $response, $args) {
    $param = (object)array(
        'Name' => $args['Name'],
        'Lat' => $args['lat'],
        'Lng' => $args['lng'],
        'Description' => $args['Description']
    );
    $result = (new api)->insert($param);

    return $response->withStatus(200)->write($result);
});
$app->get('/get', function ($request, $response, $args) {
    $response->withHeader('Content-Type', 'application/json');
    $api = (new api);
    $result = $api->getAll();
    if (!$result) {
        return $response->getBody()->write($api->error());
    } else {
        return $response->getBody()->write($api->success($result));
    }
});
$app->get('/', function ($request, $response, $args) {

    $response->withHeader('Content-Type', 'application/json');
    $api = (new api);
    $result = $api->getAll();
    if (!$result) {
        return $response->getBody()->write($api->error());
    } else {
        return $response->getBody()->write($api->success($result));
    }

});
$app->run();