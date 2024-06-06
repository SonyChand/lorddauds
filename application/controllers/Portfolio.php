<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Portfolio extends CI_Controller {
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
            'title' => 'Portfolio - Lord Daud',
        ];

            $this->load->view('templates/portfolio/header', $data);
            $this->load->view('templates/portfolio/index', $data);
            $this->load->view('templates/portfolio/footer');
        
	}
	public function detail()
	{
		$data = [
            'title' => 'Portfolio - Lord Daud',
        ];

            $this->load->view('templates/portfolio/detail', $data);
        
	}
}
