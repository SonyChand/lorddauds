<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Home extends CI_Controller {
    public function __construct()
		{
			parent::__construct();
			// maintain();
			// include_once APPPATH . "../vendor/autoload.php";
			date_default_timezone_set('Asia/Jakarta');
		}
	public function index()
	{
		$data = [
            'title' => 'Beranda',
        ];

            $this->load->view('templates/home/header', $data);
            $this->load->view('templates/home/top-sidebar', $data);
            $this->load->view('templates/home/index', $data);
            $this->load->view('templates/home/footer');
        
	}
}
